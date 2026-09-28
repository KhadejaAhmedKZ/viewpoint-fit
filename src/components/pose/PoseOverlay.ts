import { SKELETON, type Landmark } from "@/lib/pose/poseConfidence";

const KEY_JOINTS = [11, 12, 23, 24, 25, 26, 27, 28];

function cssVar(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/** Draw the pose skeleton in raw (unmirrored) video coordinates; the canvas is mirrored with the video via CSS. */
export function drawPose(canvas: HTMLCanvasElement, lms: Landmark[] | undefined, minVis: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!lms) return;
  const w = canvas.width;
  const h = canvas.height;
  const unit = Math.max(2, Math.round(Math.min(w, h) / 120));
  const ink = cssVar("--ink", "#24152F");
  const yellow = cssVar("--electric-yellow", "#FFE600");
  const pink = cssVar("--cyber-pink", "#FF007A");
  const ok = (i: number) => (lms[i]?.visibility ?? 0) >= minVis;
  ctx.lineCap = "round";
  for (const [a, b] of SKELETON) {
    if (!ok(a) || !ok(b)) continue;
    const A = lms[a]!;
    const B = lms[b]!;
    for (const [color, width] of [
      [ink, unit * 3],
      [yellow, unit * 1.6],
    ] as const) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(A.x * w, A.y * h);
      ctx.lineTo(B.x * w, B.y * h);
      ctx.stroke();
    }
  }
  for (const i of KEY_JOINTS) {
    if (!ok(i)) continue;
    const p = lms[i]!;
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, unit * 2.2, 0, Math.PI * 2);
    ctx.fillStyle = pink;
    ctx.fill();
    ctx.lineWidth = unit;
    ctx.strokeStyle = ink;
    ctx.stroke();
  }
}
