export const characterIds = ["player", "maya", "khalid", "sara", "omar"] as const;
export type CharacterId = (typeof characterIds)[number];
export type CharacterMotion =
  "idle" | "greeting" | "thinking" | "celebrate" | "squat" | "curl" | "lunge";
export const characters = {
  player: {
    name: "Your View",
    skin: "#CB8758",
    hair: "#24152F",
    outfit: "#FFE600",
    accent: "#00D9E8",
    hairStyle: "short",
  },
  maya: {
    name: "Coach Maya",
    skin: "#C98559",
    hair: "#24152F",
    outfit: "#00D9E8",
    accent: "#FF007A",
    hairStyle: "bun",
  },
  khalid: {
    name: "Khalid",
    skin: "#BC754C",
    hair: "#24152F",
    outfit: "#FFE600",
    accent: "#7B2CBF",
    hairStyle: "short",
  },
  sara: {
    name: "Sara",
    skin: "#D39873",
    hair: "#44283D",
    outfit: "#FF007A",
    accent: "#00D9E8",
    hairStyle: "ponytail",
  },
  omar: {
    name: "Omar",
    skin: "#BA805F",
    hair: "#6E6675",
    outfit: "#7B2CBF",
    accent: "#FFE600",
    hairStyle: "short",
  },
} as const;
export const outfitPresets = { yellow: "#FFE600", cyan: "#00D9E8", pink: "#FF007A" } as const;
export type OutfitPreset = keyof typeof outfitPresets;
export function avatarPreset(value: unknown): OutfitPreset {
  return value === "cyan" || value === "pink" ? value : "yellow";
}
/** Animation is illustrative only; never feeds the real pose detector. */
export function motionPose(motion: CharacterMotion, time: number, reduced = false) {
  const wave = reduced ? 0 : (1 - Math.cos(time * 1.8)) / 2;
  return {
    bounce: reduced
      ? 0
      : motion === "celebrate"
        ? Math.abs(Math.sin(time * 6)) * 0.15
        : Math.sin(time * 2) * 0.025,
    squat: motion === "squat" ? wave : 0,
    curl: motion === "curl" ? wave : 0,
    lunge: motion === "lunge" ? Math.sin((reduced ? 0 : time) * 1.5) : 0,
    wave: ["celebrate", "greeting"].includes(motion)
      ? reduced
        ? 0.5
        : 0.6 + Math.sin(time * 6) * 0.2
      : 0,
    tilt: motion === "thinking" ? 0.15 : 0,
  };
}
