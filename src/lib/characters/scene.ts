import * as T from "three";
import {
  characters,
  outfitPresets,
  motionPose,
  type CharacterId,
  type CharacterMotion,
  type OutfitPreset,
} from "./config";
export function createCharacterScene(
  canvas: HTMLCanvasElement,
  id: CharacterId,
  preset: OutfitPreset,
  portrait: boolean,
) {
  const renderer = new T.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = T.SRGBColorSpace;
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(35, 1, 0.1, 30);
  camera.position.set(0, portrait ? 2.4 : 1.8, portrait ? 3.1 : 5.5);
  camera.lookAt(0, portrait ? 1.85 : 1.35, 0);
  scene.add(new T.HemisphereLight(0xffffff, 0xb7a1c4, 2.4));
  const light = new T.DirectionalLight(0xfff5d6, 3);
  light.position.set(3, 5, 4);
  scene.add(light);
  const rim = new T.DirectionalLight(0x8eefff, 1.8);
  rim.position.set(-3, 2, -2);
  scene.add(rim);
  const c = characters[id];
  const material = (color: string) =>
    new T.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.05 });
  const skin = material(c.skin),
    hair = material(c.hair),
    suit = material(id === "player" ? outfitPresets[preset] : c.outfit),
    accent = material(c.accent),
    ink = material("#24152F"),
    white = material("#FFF9E6");
  const root = new T.Group();
  root.rotation.y = -0.2;
  scene.add(root);
  function ball(
    parent: T.Object3D,
    mat: T.Material,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
  ) {
    const mesh = new T.Mesh(new T.SphereGeometry(1, 16, 12), mat);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    parent.add(mesh);
    return mesh;
  }
  const hips = new T.Group();
  hips.position.y = 1.12;
  root.add(hips);
  ball(hips, ink, 0, 0, 0, 0.31, 0.19, 0.22);
  ball(hips, suit, 0, 0.44, 0, 0.38, 0.48, 0.24);
  ball(hips, accent, 0, 0.51, 0.225, 0.14, 0.14, 0.035);
  ball(hips, white, 0, 0.53, 0.253, 0.05, 0.08, 0.015);
  const head = new T.Group();
  head.position.set(0, 1.1, 0);
  hips.add(head);
  ball(head, skin, 0, 0, 0, 0.34, 0.39, 0.3);
  ball(head, hair, 0, 0.23, -0.055, 0.35, 0.22, 0.29);
  for (const sign of [-1, 1]) {
    ball(head, skin, sign * 0.33, -0.03, 0, 0.07, 0.11, 0.07);
    ball(head, ink, sign * 0.115, 0.015, 0.271, 0.037, 0.055, 0.02);
    ball(head, white, sign * 0.105, 0.035, 0.289, 0.011, 0.013, 0.008);
    ball(head, accent, sign * 0.19, -0.09, 0.255, 0.047, 0.022, 0.009);
  }
  ball(head, skin, 0, -0.06, 0.3, 0.048, 0.056, 0.04);
  const smile = new T.Mesh(new T.TorusGeometry(0.075, 0.012, 6, 16, Math.PI), ink);
  smile.rotation.z = Math.PI;
  smile.position.set(0, -0.125, 0.285);
  head.add(smile);
  if (c.hairStyle === "bun") ball(head, hair, 0.05, 0.45, -0.14, 0.18, 0.18, 0.17);
  if (c.hairStyle === "ponytail") ball(head, hair, 0, 0.12, -0.32, 0.16, 0.36, 0.15);
  if (id === "maya") {
    ball(head, accent, 0.33, 0, 0, 0.06, 0.14, 0.12);
    ball(head, accent, -0.33, 0, 0, 0.06, 0.14, 0.12);
  }
  const arms = [-1, 1].map((sign) => {
    const joint = new T.Group();
    joint.position.set(sign * 0.38, 0.74, 0);
    joint.rotation.z = sign * 0.12;
    hips.add(joint);
    ball(joint, suit, 0, -0.19, 0, 0.13, 0.24, 0.13);
    const elbow = new T.Group();
    elbow.position.y = -0.38;
    joint.add(elbow);
    ball(elbow, skin, 0, -0.18, 0, 0.105, 0.22, 0.105);
    ball(elbow, accent, 0, -0.29, 0, 0.11, 0.045, 0.11);
    ball(elbow, skin, 0, -0.39, 0, 0.12, 0.12, 0.11);
    return { joint, elbow };
  });
  const legs = [-1, 1].map((sign) => {
    const joint = new T.Group();
    joint.position.set(sign * 0.18, -0.1, 0);
    hips.add(joint);
    ball(joint, ink, 0, -0.22, 0, 0.145, 0.28, 0.15);
    const knee = new T.Group();
    knee.position.y = -0.43;
    joint.add(knee);
    ball(knee, ink, 0, -0.23, 0, 0.115, 0.27, 0.12);
    ball(knee, white, 0, -0.46, 0.06, 0.16, 0.11, 0.26);
    ball(knee, accent, 0, -0.47, 0.22, 0.15, 0.055, 0.09);
    return { joint, knee };
  });
  const floor = new T.Mesh(new T.CylinderGeometry(0.85, 0.85, 0.045, 40), accent);
  floor.position.y = 0.01;
  scene.add(floor);
  function render(time: number, motion: CharacterMotion, reduced: boolean) {
    const p = motionPose(motion, time, reduced);
    hips.position.y = 1.12 + p.bounce - p.squat * 0.36 - Math.abs(p.lunge) * 0.24;
    head.rotation.z = p.tilt;
    root.rotation.y = -0.2 + (reduced ? 0 : Math.sin(time * 0.5) * 0.06);
    legs.forEach(({ joint, knee }, i) => {
      joint.rotation.x = -p.squat * 0.65 + p.lunge * (i === 0 ? 0.65 : -0.65);
      knee.rotation.x = p.squat * 1.25 + Math.abs(p.lunge) * 0.7;
    });
    arms.forEach(({ joint, elbow }, i) => {
      joint.rotation.x = -p.squat * 0.9;
      joint.rotation.z = (i === 0 ? -0.12 : 0.12) + (i === 1 ? p.wave * 2.2 : 0);
      elbow.rotation.x = -p.curl * 2.1;
    });
    renderer.render(scene, camera);
  }
  return {
    render,
    resize(width: number, height: number) {
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
    },
    dispose() {
      scene.traverse((o) => {
        if (o instanceof T.Mesh) {
          o.geometry.dispose();
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          ms.forEach((m) => m.dispose());
        }
      });
      renderer.dispose();
    },
  };
}
