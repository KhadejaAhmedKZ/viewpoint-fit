export interface Point {
  x: number;
  y: number;
}

/** Angle ABC in degrees, where B is the joint. */
export function calculateAngle(a: Point, b: Point, c: Point): number {
  const ba = { x: a.x - b.x, y: a.y - b.y };
  const bc = { x: c.x - b.x, y: c.y - b.y };
  const magBA = Math.sqrt(ba.x * ba.x + ba.y * ba.y);
  const magBC = Math.sqrt(bc.x * bc.x + bc.y * bc.y);
  if (magBA === 0 || magBC === 0) return 180;
  const cosine = (ba.x * bc.x + ba.y * bc.y) / (magBA * magBC);
  return (Math.acos(Math.max(-1, Math.min(1, cosine))) * 180) / Math.PI;
}
