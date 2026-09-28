import { Character3D } from "@/components/characters/Character3D";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bug,
  Camera,
  CameraOff,
  Check,
  Loader2,
  Play,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import type { PoseLandmarker } from "@mediapipe/tasks-vision";
import { poseConfig } from "@/config/poseConfig";
import { exercises, type ExerciseId, type Reading } from "@/lib/pose/exercises";
import { newDetState, type DetState, type Side } from "@/lib/pose/detector";
import {
  emptyStats,
  formConsistency,
  formatTime,
  trackingQuality,
  type SessionStats,
} from "@/lib/pose/sessionMetrics";
import { useGame } from "@/lib/game-state";
import { cn } from "@/lib/utils";
import { GameButton, StatusChip } from "@/components/vp/ui";
import { drawPose } from "./PoseOverlay";
import { ExercisePicker } from "./ExercisePicker";
import { SessionSummary, type SummaryData } from "./SessionSummary";

type CamState = "idle" | "requesting" | "active" | "denied" | "error" | "unsupported";
type ModelState = "idle" | "loading" | "ready" | "error";
type SessionPhase = "pre" | "running" | "complete";

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

interface View {
  reading: Reading | null;
  detector: DetState;
  fps: number;
  tracked: boolean; // landmarks actually detected at least once
}

export function PoseCoach() {
  const { completePoseSession } = useGame();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const detRef = useRef<DetState>(newDetState());
  const exRef = useRef<ExerciseId>("squat");
  const sideRef = useRef<Side>("right");
  const statsRef = useRef<SessionStats>(emptyStats());
  const phaseRef = useRef<SessionPhase>("pre");
  const startRef = useRef(0);
  const lastUi = useRef(0);

  const [cam, setCam] = useState<CamState>("idle");
  const [camError, setCamError] = useState("");
  const [model, setModel] = useState<ModelState>("idle");
  const [phase, setPhase] = useState<SessionPhase>("pre");
  const [exId, setExId] = useState<ExerciseId>("squat");
  const [side, setSide] = useState<Side>("right");
  const [pendingSwitch, setPendingSwitch] = useState<ExerciseId | null>(null);
  const [view, setView] = useState<View>({
    reading: null,
    detector: newDetState(),
    tracked: false,
    fps: 0,
  });
  const [feedback, setFeedback] = useState<{ id: number; text: string } | null>(null);
  const [repPop, setRepPop] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [showDemo, setShowDemo] = useState(true);
  const [debug, setDebug] = useState(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const ex = exercises[exId];

  const say = (text: string) => setFeedback({ id: Date.now(), text });

  const stopLoop = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  const cameraRequest = useRef(0);
  const mounted = useRef(true);
  const stopCamera = useCallback(() => {
    cameraRequest.current++;
    stopLoop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    const c = canvasRef.current;
    c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
    detRef.current = newDetState();
    phaseRef.current = "pre";
    setPhase("pre");
    setView({ reading: null, detector: newDetState(), tracked: false, fps: 0 });
    setFeedback(null);
    setCam("idle");
  }, []);

  useEffect(() => {
    window.addEventListener("vp-face-camera", stopCamera);
    return () => window.removeEventListener("vp-face-camera", stopCamera);
  }, [stopCamera]);

  // Stop tracks + loop when leaving the page.
  useEffect(() => {
    mounted.current = true;
    const requestVersion = cameraRequest;
    return () => {
      mounted.current = false;
      requestVersion.current++;
      stopLoop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, []);

  const loadModel = async () => {
    if (landmarkerRef.current) return;
    setModel("loading");
    try {
      const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
      const files = await FilesetResolver.forVisionTasks(WASM);
      const create = (delegate: "GPU" | "CPU") =>
        PoseLandmarker.createFromOptions(files, {
          baseOptions: { modelAssetPath: MODEL, delegate },
          runningMode: "VIDEO",
          numPoses: 1,
        });
      const loaded = await create("GPU").catch(() => create("CPU"));
      if (!mounted.current) {
        loaded.close();
        return;
      }
      landmarkerRef.current = loaded;
      setModel("ready");
    } catch (e) {
      console.error("Pose engine failed", e);
      setModel("error");
    }
  };

  const enableCamera = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCam("unsupported");
      return;
    }
    window.dispatchEvent(new Event("vp-pose-camera"));
    const request = ++cameraRequest.current;
    setCam("requesting");
    void loadModel();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (!mounted.current || request !== cameraRequest.current || !videoRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      const v = videoRef.current!;
      v.srcObject = stream;
      await v.play();
      if (!mounted.current || request !== cameraRequest.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      setCam("active");
    } catch (e) {
      if (!mounted.current || request !== cameraRequest.current) return;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      const name = (e as DOMException)?.name;
      if (name === "NotAllowedError" || name === "SecurityError") setCam("denied");
      else {
        setCamError(
          name === "NotFoundError"
            ? "No camera was found on this device."
            : "The camera couldn't start. Close other apps using it and try again.",
        );
        setCam("error");
      }
    }
  };

  // Single detection loop, only while camera is active and model ready.
  useEffect(() => {
    if (cam !== "active" || model !== "ready") return;
    const video = videoRef.current!;
    const canvas = canvasRef.current!;
    let lastTime = -1;
    let tracked = false;
    let frames = 0;
    let fps = 0;
    let fpsStart = performance.now();
    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      const lm = landmarkerRef.current;
      if (!lm || video.readyState < 2 || video.currentTime === lastTime) return;
      lastTime = video.currentTime;
      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      const now = performance.now();
      const res = lm.detectForVideo(video, now);
      frames += 1;
      if (now - fpsStart >= 1000) {
        fps = Math.round((frames * 1000) / (now - fpsStart));
        frames = 0;
        fpsStart = now;
      }
      const lms = res.landmarks[0];
      const def = exercises[exRef.current];
      drawPose(canvas, lms, 0.6);
      if (lms) tracked = true;
      const reading = def.read(lms, sideRef.current);

      if (phaseRef.current === "running") {
        const st = statsRef.current;
        st.totalFrames += 1;
        if (reading.input !== null) st.reliableFrames += 1;
        const { d, event } = def.step(detRef.current, reading.input, now);
        detRef.current = d;
        if (event) {
          if (event === "lost") st.lostEvents += 1;
          if (event === "rep" || event === "swing") setRepPop(Date.now());
          say(def.message(event, d));
        }
        if (d.reps >= def.targetReps) {
          phaseRef.current = "complete";
          const final: SessionStats = {
            ...st,
            reps: d.reps,
            partial: d.partial,
            tooFast: d.tooFast,
            returnHints: d.returnHints,
            leftReps: d.leftReps,
            rightReps: d.rightReps,
            sideRepeats: d.sideRepeats,
            durationMs: now - startRef.current,
          };
          const res2 = completePoseSession(
            {
              id: `${def.id}-${Date.now()}`,
              exercise: def.id,
              completedAt: new Date().toISOString(),
              reps: final.reps,
              targetReps: def.targetReps,
              durationSeconds: Math.round(final.durationMs / 1000),
              formConsistency: formConsistency(final),
              trackingQuality: trackingQuality(final),
              ...(def.usesSide ? { side: sideRef.current } : {}),
              ...(def.id === "lunge"
                ? { leftReps: final.leftReps, rightReps: final.rightReps }
                : {}),
            },
            poseConfig.questXp,
          );
          setSummary({ stats: final, xp: res2.xp, badges: res2.badges, side: sideRef.current });
          setPhase("complete");
        }
      }
      if (now - lastUi.current > 80) {
        lastUi.current = now;
        setView({ reading, detector: detRef.current, tracked, fps });
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return stopLoop;
  }, [cam, model, completePoseSession]);

  // Session timer.
  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => setElapsed(performance.now() - startRef.current), 250);
    return () => clearInterval(id);
  }, [phase]);

  // Auto-clear feedback.
  useEffect(() => {
    if (!feedback) return;
    const id = setTimeout(() => setFeedback(null), 1800);
    return () => clearTimeout(id);
  }, [feedback]);

  const resetSession = () => {
    phaseRef.current = "pre";
    setPhase("pre");
    setSummary(null);
    setFeedback(null);
    setElapsed(0);
    detRef.current = newDetState();
    statsRef.current = emptyStats();
  };

  const chooseExercise = (id: ExerciseId) => {
    if (phaseRef.current === "running" && id !== exRef.current) {
      setPendingSwitch(id);
      return;
    }
    exRef.current = id;
    setExId(id);
    resetSession();
  };

  const chooseSide = (s: Side) => {
    sideRef.current = s;
    setSide(s);
  };

  const startSession = () => {
    detRef.current = newDetState();
    statsRef.current = emptyStats();
    startRef.current = performance.now();
    phaseRef.current = "running";
    setElapsed(0);
    setSummary(null);
    setPhase("running");
    say("GET READY — STAND TALL");
  };

  const again = resetSession;

  const status = view.reading?.status ?? "none";
  const live = cam === "active" && model === "ready" && view.tracked;
  const bodyReady = live && status === "good";
  const det = view.detector;
  const trackingText = !live
    ? "Not tracking"
    : status === "good"
      ? "Body tracked ✓"
      : status === "partial"
        ? ex.framing
        : "Step into view";
  const statusWord =
    cam !== "active"
      ? "Camera off"
      : phase === "running"
        ? status === "good"
          ? "Tracking"
          : "Paused"
        : bodyReady
          ? "Ready"
          : "Get ready";
  const reps = phase === "complete" ? (summary?.stats.reps ?? det.reps) : det.reps;

  return (
    <div className="space-y-4">
      <section>
        <p className="vp-label mb-2 text-ink">Choose your move</p>
        <ExercisePicker selected={exId} onSelect={chooseExercise} />
      </section>
      {cam !== "active" && (
        <section className="vp-card vp-pop bg-surface p-4">
          <p className="vp-label">3D exercise guide · {ex.name}</p>
          <GameButton tone="white" onClick={() => setShowDemo((v) => !v)}>
            {showDemo ? "Hide demo" : "Show demo"}
          </GameButton>
          {showDemo && <Character3D motion={exId} height={250} />}
          <p className="text-sm">
            Illustrative movement demonstration. Move only within a comfortable range. Real rep
            counting starts with your camera and detected landmarks.
          </p>
        </section>
      )}
      {pendingSwitch && (
        <div
          role="alertdialog"
          aria-labelledby="switch-title"
          className="vp-card vp-pop animate-pop-in bg-yellow p-4"
        >
          <p id="switch-title" className="text-xl font-bold uppercase text-ink">
            End current session?
          </p>
          <p className="text-sm text-ink">Your {ex.name} reps so far won't be saved.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <GameButton tone="white" onClick={() => setPendingSwitch(null)}>
              Cancel
            </GameButton>
            <GameButton
              tone="pink"
              onClick={() => {
                const id = pendingSwitch;
                setPendingSwitch(null);
                exRef.current = id;
                setExId(id);
                resetSession();
              }}
            >
              End &amp; switch
            </GameButton>
          </div>
        </div>
      )}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start">
        {/* Camera */}
        <section className="vp-card vp-pop-lg relative overflow-hidden bg-cyan">
          <div className="relative aspect-[3/4] w-full sm:aspect-[4/3]">
            <video
              ref={videoRef}
              playsInline
              muted
              className={cn(
                "absolute inset-0 h-full w-full -scale-x-100 object-cover",
                cam !== "active" && "invisible",
              )}
            />
            <canvas
              ref={canvasRef}
              className={cn(
                "pointer-events-none absolute inset-0 h-full w-full -scale-x-100 object-cover",
                cam !== "active" && "invisible",
              )}
              aria-hidden
            />

            {cam !== "active" ? (
              <div className="vp-grid absolute inset-0 grid place-items-center p-6 text-center">
                <div className="max-w-xs space-y-3">
                  <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border-[3px] border-ink bg-surface">
                    {cam === "requesting" ? (
                      <Loader2 className="h-8 w-8 animate-spin" />
                    ) : cam === "idle" ? (
                      <Camera className="h-8 w-8" />
                    ) : (
                      <TriangleAlert className="h-8 w-8" />
                    )}
                  </span>
                  {cam === "idle" && (
                    <>
                      <p className="text-sm font-semibold text-ink">
                        Your camera is processed locally on your device for movement feedback. Video
                        is not saved by VIEW POINT FIT.
                      </p>
                      <GameButton tone="yellow" onClick={enableCamera} className="w-full">
                        <Camera className="h-4 w-4" /> Enable camera
                      </GameButton>
                    </>
                  )}
                  {cam === "requesting" && <p className="vp-label text-ink">Starting camera…</p>}
                  {cam === "denied" && (
                    <>
                      <p className="text-xl font-bold uppercase text-ink">Camera access needed</p>
                      <p className="text-sm text-ink">
                        Allow camera access in your browser to use Pose Coach.
                      </p>
                      <GameButton onClick={enableCamera} className="w-full">
                        Try again
                      </GameButton>
                    </>
                  )}
                  {cam === "error" && (
                    <>
                      <p className="text-xl font-bold uppercase text-ink">Camera didn't start</p>
                      <p className="text-sm text-ink">{camError}</p>
                      <GameButton onClick={enableCamera} className="w-full">
                        Try again
                      </GameButton>
                    </>
                  )}
                  {cam === "unsupported" && (
                    <>
                      <p className="text-xl font-bold uppercase text-ink">Camera not available</p>
                      <p className="text-sm text-ink">
                        Pose Coach requires browser camera access. Open the app over a secure
                        (https) link in a browser with camera support.
                      </p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                  <StatusChip tone={live ? (status === "good" ? "lime" : "yellow") : "white"}>
                    {live ? (status === "good" ? "Live" : "Paused") : "Not tracking"}
                  </StatusChip>
                  <StatusChip tone="white">
                    {model === "loading" ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" /> Loading pose engine…
                      </>
                    ) : model === "ready" ? (
                      "Pose engine ready"
                    ) : model === "error" ? (
                      "Pose engine failed"
                    ) : (
                      "—"
                    )}
                  </StatusChip>
                </div>
                {feedback && (
                  <p
                    key={feedback.id}
                    className="vp-label animate-pop-in absolute inset-x-3 bottom-3 rounded-xl border-[3px] border-ink bg-yellow px-3 py-2 text-center text-sm text-ink"
                    role="status"
                  >
                    {feedback.text}
                  </p>
                )}
                {repPop > 0 && phase === "running" && (
                  <span
                    key={repPop}
                    className="animate-toast pointer-events-none absolute right-4 top-14 rounded-xl border-[3px] border-ink bg-pink px-3 py-1 text-2xl font-bold text-surface"
                  >
                    +1 REP
                  </span>
                )}
              </>
            )}
          </div>
          {model === "error" && (
            <p className="border-t-[3px] border-ink bg-surface p-3 text-sm text-ink">
              The pose engine couldn't load. Check your connection and reload the page — Pose Coach
              won't count reps without it.
            </p>
          )}
        </section>

        {/* Controls / HUD */}
        <div className="space-y-4">
          {summary && phase === "complete" ? (
            <SessionSummary ex={ex} data={summary} onAgain={again} />
          ) : (
            <section className="vp-card vp-pop bg-surface p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="vp-label text-muted-foreground">
                    {ex.difficulty} · Target {ex.targetReps} reps
                    {ex.usesSide ? ` · ${side} arm` : ""}
                    {ex.id === "lunge" ? " · Alternating" : ""}
                  </p>
                  <h2 className="text-3xl font-bold uppercase text-ink">{ex.name}</h2>
                </div>
                <StatusChip tone="ink">{statusWord}</StatusChip>
              </div>
              <p className="vp-label mt-2 text-ink" aria-live="polite">
                {cam === "active" ? trackingText : "Camera off"}
              </p>

              <div className="mt-3 flex items-end gap-2">
                <span className="text-5xl font-bold leading-none text-ink">{reps}</span>
                <span className="pb-1 text-xl font-bold text-muted-foreground">
                  / {ex.targetReps}
                </span>
                <span className="vp-label pb-1 text-muted-foreground">reps</span>
              </div>
              <div
                className="mt-2 grid grid-cols-10 gap-1"
                aria-label={`${reps} of ${ex.targetReps} reps`}
              >
                {Array.from({ length: ex.targetReps }, (_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-3 rounded-sm border-2 border-ink",
                      i < reps ? "bg-pink" : "bg-surface-2",
                    )}
                  />
                ))}
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-2 text-center sm:grid-cols-3">
                {[
                  ["State", phase === "running" ? det.state : "—"],
                  ["Time", formatTime(phase === "running" ? elapsed : 0)],
                  [
                    "Form",
                    phase === "running" && det.reps + det.partial > 0
                      ? det.partial > det.reps / 3
                        ? "Full range"
                        : "Good"
                      : "—",
                  ],
                  [
                    ex.angleLabel,
                    view.reading?.angle != null ? `${view.reading.angle.toFixed(0)}°` : "—",
                  ],
                  ...(ex.id === "lunge"
                    ? [["Left / Right", `${det.leftReps} / ${det.rightReps}`]]
                    : []),
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl border-2 border-ink bg-surface-2 p-2">
                    <dt className="vp-label text-[0.6rem] text-muted-foreground">{k}</dt>
                    <dd className="font-bold text-ink">{v}</dd>
                  </div>
                ))}
              </dl>

              {ex.usesSide && phase === "pre" && (
                <div className="mt-4">
                  <p className="vp-label text-ink">Choose arm</p>
                  <div
                    className="mt-2 grid grid-cols-2 gap-2"
                    role="radiogroup"
                    aria-label="Choose arm"
                  >
                    {(["left", "right"] as const).map((s) => (
                      <GameButton
                        key={s}
                        tone={side === s ? "ink" : "white"}
                        onClick={() => chooseSide(s)}
                        className="w-full"
                      >
                        {s} arm
                      </GameButton>
                    ))}
                  </div>
                </div>
              )}
              {cam === "active" && phase === "pre" && (
                <div className="mt-4 space-y-2">
                  <p
                    className={cn(
                      "vp-label flex items-center gap-2",
                      bodyReady ? "text-ink" : "text-muted-foreground",
                    )}
                  >
                    {bodyReady ? (
                      <>
                        <Check className="h-4 w-4" strokeWidth={4} />{" "}
                        {ex.usesSide ? "Arm detected ✓" : "Full body detected ✓"}
                      </>
                    ) : (
                      `Get ready — ${ex.framing.toLowerCase()}`
                    )}
                  </p>
                  <GameButton
                    tone="pink"
                    disabled={!bodyReady}
                    onClick={startSession}
                    className="w-full"
                  >
                    <Play className="h-4 w-4 fill-current" /> Start session
                  </GameButton>
                </div>
              )}
            </section>
          )}

          {phase === "running" && (
            <p className="vp-label text-center text-muted-foreground">
              Form · Form consistency (prototype coaching metric){" "}
              {formConsistency({
                ...statsRef.current,
                reps: det.reps,
                partial: det.partial,
                tooFast: det.tooFast,
              })}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {cam === "active" && (
              <GameButton tone="white" onClick={stopCamera} className="flex-1">
                <CameraOff className="h-4 w-4" /> Stop camera
              </GameButton>
            )}
            {import.meta.env.DEV && (
              <GameButton
                tone={debug ? "ink" : "white"}
                onClick={() => setDebug((d) => !d)}
                className="flex-1"
              >
                <Bug className="h-4 w-4" /> Pose debug
              </GameButton>
            )}
          </div>

          {import.meta.env.DEV && debug && (
            <pre className="vp-card overflow-x-auto bg-surface p-3 text-xs text-ink">
              {[
                ["Exercise", ex.name],
                ["Inference", model === "ready" ? `${view.fps} fps` : model],
                ["Tracking", status],
                ["Required", ex.requiredLandmarks(side).join(",")],
                ["Session", phase],
                ...(view.reading?.debug ?? []),
                [
                  "Smoothed",
                  det.smoothed.map((v) => (v == null ? "—" : `${v.toFixed(0)}°`)).join(" / ") ||
                    "—",
                ],
                ["State", det.state],
                ...(ex.id === "lunge" ? [["Side", det.side ?? det.lastSide ?? "—"]] : []),
                [
                  "Rep timer",
                  det.cycleStart ? `${Math.round(performance.now() - det.cycleStart)} ms` : "—",
                ],
                ["Partial / fast", `${det.partial} / ${det.tooFast}`],
                ["Thresholds", ex.thresholds],
              ]
                .map(([k, v]) => `${String(k).toUpperCase().padEnd(14)}${v}`)
                .join("\n")}
            </pre>
          )}

          <aside className="vp-card bg-surface-2 p-4">
            <h3 className="vp-label flex items-center gap-2 text-ink">
              <ShieldCheck className="h-4 w-4" /> Camera privacy
            </h3>
            <p className="mt-1 text-sm text-ink">
              Pose processing happens locally in your browser. VIEW POINT FIT does not need to save
              your raw camera video for this prototype.
            </p>
            <p className="vp-label mt-3 text-ink">Movement coaching only</p>
            <p className="text-sm text-ink">
              VIEW POINT FIT provides general movement feedback and does not diagnose injuries or
              replace professional medical or fitness guidance. Stop if you feel pain or unwell.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
