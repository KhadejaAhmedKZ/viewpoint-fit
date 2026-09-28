import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FaceControl } from "./FaceControl";
const defaults = {
  largeText: false,
  highContrast: false,
  reducedMotion: false,
  replies: false,
  reader: false,
};
export const A11Y_KEY = "view-point-fit-accessibility";
export function readSettings(raw: string | null) {
  try {
    const data = JSON.parse(raw || "{}");
    return Object.fromEntries(
      Object.entries(defaults).map(([k, v]) => [k, typeof data?.[k] === "boolean" ? data[k] : v]),
    ) as typeof defaults;
  } catch {
    return { ...defaults };
  }
}
export function say(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.slice(0, 5000));
  const local = window.speechSynthesis
    .getVoices()
    .find((v) => v.localService && v.lang.startsWith("en"));
  if (!local) return;
  utterance.voice = local;
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}
type Recognition = {
  start: () => void;
  abort: () => void;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
export function Accessibility() {
  const [settings, setSettings] = useState(defaults),
    [ready, setReady] = useState(false),
    [open, setOpen] = useState(false),
    [face, setFace] = useState(false),
    [listening, setListening] = useState(false),
    [transcript, setTranscript] = useState(""),
    [notice, setNotice] = useState(""),
    [voiceAvailable, setVoiceAvailable] = useState(false),
    [micConsent, setMicConsent] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  const target = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  useEffect(() => {
    try {
      setSettings(readSettings(localStorage.getItem(A11Y_KEY)));
    } catch {
      /* Storage may be unavailable in private browsing. */
    }
    setReady(true);
    const voices = () =>
      setVoiceAvailable(
        !!window.speechSynthesis
          ?.getVoices()
          .some((v) => v.localService && v.lang.startsWith("en")),
      );
    voices();
    window.speechSynthesis?.addEventListener("voiceschanged", voices);
    return () => {
      window.speechSynthesis?.removeEventListener("voiceschanged", voices);
      window.speechSynthesis?.cancel();
      recognition.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(A11Y_KEY, JSON.stringify(settings));
    } catch {
      /* Storage may be unavailable in private browsing. */
    }
    for (const k of ["largeText", "highContrast", "reducedMotion"] as const)
      document.documentElement.classList.toggle("a11y-" + k, settings[k]);
    window.dispatchEvent(new Event("vp-motion-change"));
    if (!settings.reader && !settings.replies) window.speechSynthesis?.cancel();
  }, [settings, ready]);
  useEffect(() => {
    const focus = (e: FocusEvent) => {
      const el = e.target;
      if (!(el instanceof HTMLElement)) return;
      if (
        (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) &&
        !el.closest('[role="dialog"]') &&
        !["password", "email", "hidden"].includes(el.type)
      )
        target.current = el;
      if (settings.reader) {
        const labels = (el as HTMLInputElement).labels;
        const label =
          el.getAttribute("aria-label") ||
          Array.from(labels || [])
            .map((l) => l.textContent)
            .join(" ") ||
          el.getAttribute("title") ||
          el.textContent ||
          "";
        say(label.trim().slice(0, 180));
      }
    };
    document.addEventListener("focusin", focus);
    return () => document.removeEventListener("focusin", focus);
  }, [settings.reader]);
  useEffect(() => {
    if (!settings.replies) return;
    const seen = new WeakSet<Element>();
    document.querySelectorAll("[data-maya-reply]").forEach((e) => seen.add(e));
    const observer = new MutationObserver(() => {
      document.querySelectorAll("[data-maya-reply]").forEach((el) => {
        if (!seen.has(el)) {
          seen.add(el);
          say(el.textContent || "");
        }
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [settings.replies]);
  useEffect(() => {
    if (!settings.reader) return;
    let title = document.title;
    const observer = new MutationObserver(() => {
      if (title !== document.title) {
        title = document.title;
        say(title);
      }
    });
    observer.observe(document.head, { subtree: true, childList: true });
    return () => observer.disconnect();
  }, [settings.reader]);
  const stop = () => {
    window.speechSynthesis?.cancel();
    recognition.current?.abort();
    setListening(false);
    setFace(false);
  };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        window.speechSynthesis?.cancel();
        recognition.current?.abort();
        setListening(false);
        setFace(false);
      }
    };
    const hidden = () => {
      if (document.hidden) {
        recognition.current?.abort();
        setListening(false);
        setFace(false);
        window.speechSynthesis?.cancel();
      }
    };
    document.addEventListener("keydown", key);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, []);
  function dictate() {
    const w = window as typeof window & {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    const Constructor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Constructor) {
      setNotice("Voice input is unavailable in this browser. You can type instead.");
      return;
    }
    recognition.current?.abort();
    const r = new Constructor();
    recognition.current = r;
    r.lang = "en-US";
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (e) =>
      setTranscript(
        Array.from(e.results)
          .map((a) => a[0]?.transcript || "")
          .join(" "),
      );
    r.onend = () => setListening(false);
    r.onerror = () => {
      setListening(false);
      setNotice("Microphone access or speech recognition failed. Please try again or type.");
    };
    try {
      r.start();
      setListening(true);
      setNotice("Listening. Your words will appear here for review.");
    } catch {
      setNotice("Voice input could not start.");
    }
  }
  const buttons: [keyof typeof defaults, string, string][] = [
    ["largeText", "Large text", "Increase text size throughout the app."],
    ["highContrast", "High contrast", "Stronger text and surface contrast."],
    ["reducedMotion", "Reduce motion", "Stop decorative animations and animated characters."],
    ["replies", "Read replies aloud", "Read new Maya replies using a local device voice."],
    [
      "reader",
      "Read controls aloud",
      "Speak labels as you move through controls with Tab. Use Read page for page content.",
    ],
  ];
  return (
    <>
      <div className="a11y-toolbar">
        <Dialog
          open={open}
          onOpenChange={(value) => {
            setOpen(value);
            if (!value) {
              recognition.current?.abort();
              setListening(false);
            }
          }}
        >
          <DialogTrigger asChild>
            <button className="a11y-button" aria-label="Accessibility settings">
              Accessibility
            </button>
          </DialogTrigger>
          <DialogContent className="max-h-[85dvh] overflow-y-auto">
            <DialogTitle>Accessibility</DialogTitle>
            <DialogDescription>
              Adapt VIEW POINT FIT. Display and reading preferences stay on this device. Camera and
              microphone start only when requested.
            </DialogDescription>
            {buttons.map(([key, label, desc]) => (
              <div key={key} className="flex items-center justify-between gap-4 border-b pb-3">
                <div>
                  <label htmlFor={"a11y-" + key} className="font-bold">
                    {label}
                  </label>
                  <p className="text-sm">{desc}</p>
                </div>
                <button
                  id={"a11y-" + key}
                  role="switch"
                  aria-checked={settings[key]}
                  disabled={(key === "reader" || key === "replies") && !voiceAvailable}
                  className="a11y-button"
                  onClick={() => setSettings((s) => ({ ...s, [key]: !s[key] }))}
                >
                  {settings[key] ? "On" : "Off"}
                </button>
              </div>
            ))}
            {!voiceAvailable && (
              <p role="status">
                A local English voice is not available yet. Your device’s screen reader still works.
              </p>
            )}
            <p className="text-sm">
              Read-aloud is an optional helper. If you use VoiceOver or another screen reader, leave
              it off to avoid duplicate speech.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                className="a11y-button"
                disabled={!voiceAvailable}
                onClick={() =>
                  say(
                    (document.querySelector("main") || document.getElementById("vp-main"))
                      ?.textContent || "No page content available.",
                  )
                }
              >
                Read page
              </button>
              <button className="a11y-button" onClick={() => window.speechSynthesis?.cancel()}>
                Stop reading
              </button>
            </div>
            <h3 className="font-bold">Hands-free face control</h3>
            <p>
              Move your head to steer, hold a deliberate blink to click. Camera processing stays on
              this device. Starting Pose Coach stops face control. Press Escape to stop.
            </p>
            <button
              className="a11y-button"
              aria-pressed={face}
              onClick={() => {
                setFace(!face);
                setOpen(false);
              }}
            >
              {face ? "Stop face control" : "Start face control"}
            </button>
            <h3 className="font-bold">Voice input</h3>
            <p>
              First focus a text field, then open this panel. Review the transcript before inserting
              it. Nothing is submitted automatically.
            </p>
            <label>
              <input
                type="checkbox"
                checked={micConsent}
                onChange={(e) => setMicConsent(e.target.checked)}
              />{" "}
              I understand my browser may send audio to its speech service.
            </label>
            <button
              className="a11y-button"
              disabled={!micConsent}
              onClick={() =>
                listening ? (recognition.current?.abort(), setListening(false)) : dictate()
              }
            >
              {listening ? "Stop listening" : "Start voice input"}
            </button>
            <label>
              Transcript
              <textarea
                className="w-full border p-2"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
              />
            </label>
            <button
              className="a11y-button"
              disabled={!transcript}
              onClick={() => {
                const el = target.current;
                if (!el?.isConnected || el.disabled || el.readOnly) {
                  setNotice("Focus an editable field outside this panel first.");
                  return;
                }
                const proto =
                  el instanceof HTMLTextAreaElement
                    ? HTMLTextAreaElement.prototype
                    : HTMLInputElement.prototype;
                Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, transcript);
                el.dispatchEvent(new Event("input", { bubbles: true }));
                el.dispatchEvent(new Event("change", { bubbles: true }));
                setOpen(false);
                el.focus();
              }}
            >
              Insert into selected field
            </button>
            <p role="status">{notice}</p>
            <button
              className="a11y-button"
              onClick={() => {
                stop();
                setSettings({ ...defaults });
                setTranscript("");
                setMicConsent(false);
              }}
            >
              Reset accessibility settings
            </button>
          </DialogContent>
        </Dialog>
        {(face || listening || settings.reader || settings.replies) && (
          <button className="a11y-button" onClick={stop}>
            Stop assistive activity
          </button>
        )}
      </div>
      {face && <FaceControl onStop={() => setFace(false)} />}
    </>
  );
}
