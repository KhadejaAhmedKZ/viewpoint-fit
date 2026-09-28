import { z } from "zod";
import { AGENT_IDS } from "./agents";

const CATEGORIES = ["move", "fuel", "recover", "learn"] as const;

/** Validated structured reply rendered as a card. */
export const coachReplySchema = z.object({
  agent: z.enum(AGENT_IDS),
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(600),
  why: z.string().max(600),
  example: z.string().max(400).nullable(),
  actions: z
    .array(z.string().min(1).max(200))
    .max(5)
    .transform((a) => a.slice(0, 3)),
  missionSuggestion: z
    .object({
      title: z.string().min(1).max(60),
      description: z.string().max(140),
      category: z.enum(CATEGORIES),
    })
    .nullable(),
  followUps: z
    .array(z.string().min(1).max(60))
    .max(5)
    .transform((a) => a.slice(0, 3)),
  link: z.enum(["pose", "progress", "lab", "none"]),
  relatedCaseId: z.enum(["001", "002", "003", "none"]),
  safetyLevel: z.enum(["wellness", "caution"]),
  disclaimer: z.string().max(300).nullable(),
});
export type CoachReply = z.infer<typeof coachReplySchema>;

const str = { type: "string" } as const;
const nullableStr = { type: ["string", "null"] } as const;

/** Strict JSON schema for the gateway (every property required, nullable optionals, no extras). */
export const coachReplyJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "agent",
    "title",
    "summary",
    "why",
    "example",
    "actions",
    "missionSuggestion",
    "followUps",
    "link",
    "relatedCaseId",
    "safetyLevel",
    "disclaimer",
  ],
  properties: {
    agent: { type: "string", enum: [...AGENT_IDS] },
    title: { ...str, description: "Short card title, max ~6 words." },
    summary: {
      ...str,
      description: "1–2 short sentences using the user's actual app data where relevant.",
    },
    why: { ...str, description: "Why it matters, 1–2 short sentences." },
    example: {
      ...nullableStr,
      description: "Short real-life example (education answers), else null.",
    },
    actions: { type: "array", items: str, description: "1–3 realistic, small actions for today." },
    missionSuggestion: {
      type: ["object", "null"],
      additionalProperties: false,
      required: ["title", "description", "category"],
      properties: {
        title: str,
        description: str,
        category: { type: "string", enum: [...CATEGORIES] },
      },
      description:
        "Optional small same-day habit mission (e.g. 10-minute movement break), else null.",
    },
    followUps: {
      type: "array",
      items: str,
      description: "2–3 short contextual follow-up questions the user might tap.",
    },
    link: {
      type: "string",
      enum: ["pose", "progress", "lab", "none"],
      description:
        "pose when suggesting a Pose Coach exercise; progress for progress summaries; lab for case lessons.",
    },
    relatedCaseId: {
      type: "string",
      enum: ["001", "002", "003", "none"],
      description: "A SOLVED case whose lesson relates, else none.",
    },
    safetyLevel: { type: "string", enum: ["wellness", "caution"] },
    disclaimer: {
      ...nullableStr,
      description: "Only when safetyLevel is caution: suggest professional guidance. Else null.",
    },
  },
} as const;
