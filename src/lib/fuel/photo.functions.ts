import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { analyzeFoodPhoto } from "./photo.server";
export const getFoodProvider = createServerFn({ method: "GET" }).handler(() => ({
  provider: process.env["GEMINI_API_KEY"] ? ("gemini" as const) : ("lovable" as const),
}));
export const analyzeMeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        image: z
          .string()
          .max(2500000)
          .regex(/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/=]+$/),
        consent: z.literal(true),
        provider: z.enum(["gemini", "lovable"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const provider = process.env["GEMINI_API_KEY"] ? "gemini" : "lovable";
    if (data.provider !== provider)
      return {
        ok: false as const,
        message: "The image provider changed. Refresh and review the consent notice again.",
      };
    const key = process.env["GEMINI_API_KEY"] || process.env["LOVABLE_API_KEY"];
    if (!key)
      return {
        ok: false as const,
        message: "Photo AI is not configured. Enter foods, portions and package values below.",
      };
    const quota = await context.supabase.rpc("consume_coach_request");
    if (quota.error || !quota.data)
      return {
        ok: false as const,
        message:
          "Photo analysis is unavailable or the request limit was reached. Retry later or enter the meal manually.",
      };
    try {
      return { ok: true as const, report: await analyzeFoodPhoto(data.image, key, provider) };
    } catch {
      return {
        ok: false as const,
        message:
          "The photo could not be analyzed reliably. Try a clearer food photo or enter the foods manually.",
      };
    }
  });
