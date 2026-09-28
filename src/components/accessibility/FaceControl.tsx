import { useEffect, useRef, useState } from "react";
export function FaceControl({ onStop }: { onStop: () => void }) {
  const video = useRef<HTMLVideoElement>(null),
    cursor = useRef<HTMLDivElement>(null),
    stop = useRef(onStop);
  stop.current = onStop;
  const [status, setStatus] = useState("Starting camera…"),
    [gain, setGain] = useState(3.5);
  const sensitivity = useRef(gain);
  sensitivity.current = gain;
  useEffect(() => {
    let cancelled = false,
      frame = 0,
      stream: MediaStream | undefined,
      model: import("@mediapipe/tasks-vision").FaceLandmarker | undefined;
    let x = innerWidth / 2,
      y = innerHeight / 2,
      closedAt = 0,
      lastClick = 0,
      lastVideo = -1;
    const clean = () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((t) => t.stop());
      model?.close();
      model = undefined;
      if (video.current) video.current.srcObject = null;
    };
    const other = () => {
      clean();
      stop.current();
    };
    window.addEventListener("vp-pose-camera", other);
    async function start() {
      try {
        window.dispatchEvent(new Event("vp-face-camera"));
        const vision = await import("@mediapipe/tasks-vision");
        if (cancelled) return;
        const files = await vision.FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm",
        );
        if (cancelled) return;
        const loaded = await vision.FaceLandmarker.createFromOptions(files, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: true,
        });
        if (cancelled) {
          loaded.close();
          return;
        }
        model = loaded;
        const incoming = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 },
          audio: false,
        });
        if (cancelled) {
          incoming.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = incoming;
        video.current!.srcObject = stream;
        await video.current!.play();
        if (cancelled) return;
        frame = requestAnimationFrame(loop);
      } catch {
        if (!cancelled) {
          clean();
          setStatus(
            "Face control could not start. Check camera permission and connection, then stop and retry.",
          );
        }
      }
    }
    function loop(now: number) {
      if (cancelled) return;
      try {
        const v = video.current;
        if (v && model && v.readyState >= 2 && v.currentTime !== lastVideo) {
          lastVideo = v.currentTime;
          const result = model.detectForVideo(v, now),
            nose = result.faceLandmarks[0]?.[1];
          if (nose) {
            setStatus("Face detected. Move your head and blink deliberately.");
            x +=
              (Math.max(
                12,
                Math.min(
                  innerWidth - 12,
                  (0.5 - (nose.x - 0.5) * sensitivity.current) * innerWidth,
                ),
              ) -
                x) *
              0.3;
            y +=
              (Math.max(
                12,
                Math.min(
                  innerHeight - 12,
                  (0.5 + (nose.y - 0.5) * sensitivity.current) * innerHeight,
                ),
              ) -
                y) *
              0.3;
            if (cursor.current) cursor.current.style.transform = `translate(${x}px,${y}px)`;
            const cats = result.faceBlendshapes[0]?.categories || [];
            const blink = ["eyeBlinkLeft", "eyeBlinkRight"].every(
              (n) => (cats.find((c) => c.categoryName === n)?.score || 0) > 0.55,
            );
            if (blink && !closedAt) closedAt = now;
            if (!blink && closedAt) {
              const duration = now - closedAt;
              closedAt = 0;
              if (duration >= 300 && duration < 1200 && now - lastClick > 1000) {
                lastClick = now;
                const el = document
                  .elementFromPoint(x, y)
                  ?.closest<HTMLElement>(
                    'button,a,input,textarea,select,[role="button"],[role="switch"]',
                  );
                if (el && !el.matches(':disabled,[aria-disabled="true"]')) {
                  el.focus();
                  if (!el.matches('textarea,input:not([type="checkbox"]):not([type="radio"])'))
                    el.click();
                }
              }
            }
          } else {
            closedAt = 0;
            setStatus("No face detected. Centre your face in good lighting.");
          }
        }
        frame = requestAnimationFrame(loop);
      } catch {
        clean();
        setStatus("Tracking stopped. Stop and restart face control to retry.");
      }
    }
    void start();
    return () => {
      clean();
      window.removeEventListener("vp-pose-camera", other);
    };
  }, []);
  return (
    <>
      <video ref={video} muted playsInline className="a11y-camera" aria-hidden="true" />
      <div ref={cursor} className="a11y-cursor" aria-hidden="true" />
      <section className="a11y-face" aria-label="Face control">
        <p role="status">{status}</p>
        <label>
          Sensitivity
          <input
            type="range"
            min="1"
            max="6"
            step="0.5"
            value={gain}
            onChange={(e) => setGain(Number(e.target.value))}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            className="a11y-button"
            onClick={() => window.scrollBy({ top: -innerHeight * 0.6 })}
          >
            Scroll up
          </button>
          <button
            className="a11y-button"
            onClick={() => window.scrollBy({ top: innerHeight * 0.6 })}
          >
            Scroll down
          </button>
          <button className="a11y-button" onClick={onStop}>
            Stop face control
          </button>
        </div>
      </section>
    </>
  );
}
