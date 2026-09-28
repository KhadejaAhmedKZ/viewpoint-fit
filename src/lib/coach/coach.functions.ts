import { serverSnapshot } from "./snapshot.server";
import { buildCoachContext } from "./context";
import { mentionedCase, routeIntent } from "./router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { AGENT_IDS } from "./agents";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { classifySafety, safetyNotice } from "./safety";
import { callCoach } from "./coach.server";

const inputSchema = z.object({
  message: z.string().trim().min(1).max(1000),
  history: z
    .array(z.object({ role: z.enum(["user", "maya"]), text: z.string().max(1500) }))
    .max(12),
  agent: z.enum(AGENT_IDS),
  routeReason: z.string().max(300),
  caution: z.boolean(),
  context: z
    .record(z.string(), z.unknown())
    .refine((c) => JSON.stringify(c).length <= 12000, "Context too large"),
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/** Single server-side VIEW POINT AI endpoint. The key never reaches the browser. */
export const askCoach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => inputSchema.parse(d))
  .handler(async ({ data, context }) => {
    const safety = classifySafety(data.message);
    const notice = safetyNotice(safety.category, data.message);
    if (notice)
      return {
        ok: true as const,
        plain: [notice.title, notice.body, ...notice.bullets].join("\n"),
      };
    const provider = process.env["GEMINI_API_KEY"] ? "gemini" : "lovable";
    const key = process.env["GEMINI_API_KEY"] || process.env["LOVABLE_API_KEY"];
    if (!key)
      return { ok: false as const, status: 500, message: "VIEW POINT AI is not configured yet." };
    try {
      const requestedDay = Date.parse(data.day + "T12:00:00Z");
      if (!Number.isFinite(requestedDay) || Math.abs(Date.now() - requestedDay) > 48 * 3600000)
        return {
          ok: false as const,
          status: 400,
          message: "Refresh your daily context and retry.",
        };
      const quota = await context.supabase.rpc("consume_coach_request");
      if (quota.error)
        return {
          ok: false as const,
          status: 503,
          message: "Coach setup is incomplete. Use Quick Guidance for now.",
        };
      if (!quota.data)
        return {
          ok: false as const,
          status: 429,
          message: "Please wait a minute before asking again.",
        };
      const snapshot = await serverSnapshot(context.supabase, context.userId, data.day);
      const route = routeIntent(data.message, null);
      const caseId = mentionedCase(data.message);
      if (caseId && !snapshot.solvedCases.some((c) => c.id === caseId))
        return {
          ok: true as const,
          plain:
            "Investigate the case first. Look for patterns across the evidence; Maya can discuss the full lesson after you solve it.",
        };
      return await callCoach(
        {
          ...data,
          agent: route.agent,
          routeReason: route.reason,
          context: buildCoachContext(snapshot, route.agent, route.contextAgent, caseId),
          caution: safety.level === "caution",
        },
        key,
        AbortSignal.timeout(30000),
        provider,
      );
    } catch (e) {
      console.error("Coach service unavailable");
      return { ok: false as const, status: 503, message: "Couldn't reach the coach service." };
    }
  });
