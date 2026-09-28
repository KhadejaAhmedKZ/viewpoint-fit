import { useEffect, useRef, useState } from "react";
import { AvatarFigure } from "@/components/vp/AvatarCard";
import {
  characters,
  type CharacterId,
  type CharacterMotion,
  type OutfitPreset,
} from "@/lib/characters/config";
export function Character3D({
  character = "player",
  motion = "idle",
  preset = "yellow",
  portrait = false,
  height = 280,
}: {
  character?: CharacterId;
  motion?: CharacterMotion;
  preset?: OutfitPreset;
  portrait?: boolean;
  height?: number;
}) {
  const host = useRef<HTMLDivElement>(null),
    canvas = useRef<HTMLCanvasElement>(null);
  const activeMotion = useRef(motion);
  activeMotion.current = motion;
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  useEffect(() => {
    let disposed = false,
      visible = false,
      frame = 0,
      last = 0;
    let view:
      | Awaited<ReturnType<(typeof import("@/lib/characters/scene"))["createCharacterScene"]>>
      | undefined;
    let started = false;
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const target = host.current!;
    const render = (now: number) => {
      if (disposed || !visible || document.hidden || !view) return;
      if (now - last >= 33) {
        view.render(
          now / 1000,
          activeMotion.current,
          motionPreference.matches ||
            document.documentElement.classList.contains("a11y-reducedMotion"),
        );
        last = now;
      }
      if (!(
        motionPreference.matches ||
        document.documentElement.classList.contains("a11y-reducedMotion")
      ))
        frame = requestAnimationFrame(render);
    };
    const resume = () => {
      cancelAnimationFrame(frame);
      if (visible && !document.hidden) frame = requestAnimationFrame(render);
    };
    const resize = new ResizeObserver(() => {
      view?.resize(target.clientWidth, target.clientHeight);
      resume();
    });
    resize.observe(target);
    const start = async () => {
      if (started) return;
      started = true;
      try {
        const { createCharacterScene } = await import("@/lib/characters/scene");
        if (disposed) return;
        view = createCharacterScene(canvas.current!, character, preset, portrait);
        view.resize(target.clientWidth, target.clientHeight);
        setStatus("ready");
        resume();
      } catch {
        if (!disposed) setStatus("fallback");
      }
    };
    const observer = new IntersectionObserver(
      (entries) => {
        visible = !!entries[0]?.isIntersecting;
        if (visible) void start();
        resume();
      },
      { rootMargin: "80px" },
    );
    observer.observe(target);
    const lost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(frame);
      view?.dispose();
      view = undefined;
      setStatus("fallback");
    };
    const element = canvas.current!;
    element.addEventListener("webglcontextlost", lost);
    document.addEventListener("visibilitychange", resume);
    motionPreference.addEventListener("change", resume);
    window.addEventListener("vp-motion-change", resume);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      element.removeEventListener("webglcontextlost", lost);
      document.removeEventListener("visibilitychange", resume);
      motionPreference.removeEventListener("change", resume);
      window.removeEventListener("vp-motion-change", resume);
      view?.dispose();
    };
  }, [character, preset, portrait]);
  return (
    <div
      ref={host}
      role="img"
      aria-label={`${characters[character].name}, stylized ${status === "fallback" ? "illustrated" : "3D"} character${["squat", "curl", "lunge"].includes(motion) ? `. Illustrative ${motion} demonstration, not live detection.` : ""}`}
      className="relative w-full overflow-hidden rounded-2xl"
      style={{ height }}
    >
      <canvas
        ref={canvas}
        aria-hidden
        className={status === "fallback" ? "hidden" : "h-full w-full"}
      />
      {status !== "ready" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <AvatarFigure size={110} />
          <p className="vp-label text-xs" role="status">
            {status === "loading" ? "Loading character…" : "Illustrated view · 3D unavailable"}
          </p>
        </div>
      )}
    </div>
  );
}
