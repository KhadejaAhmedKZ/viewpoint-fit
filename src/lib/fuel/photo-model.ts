import { z } from "zod";
const nutrient = z.number().finite().min(0).max(100).nullable();
export const foodItemSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    grams: z.number().finite().min(1).max(3000),
    kcal100Low: z.number().finite().min(0).max(1000),
    kcal100High: z.number().finite().min(0).max(1000),
    protein100: nutrient,
    carbs100: nutrient,
    fat100: nutrient,
  })
  .refine((v) => v.kcal100Low <= v.kcal100High, "Lower calories must not exceed upper calories.");
export type FoodItem = z.infer<typeof foodItemSchema>;
export function foodTotals(items: FoodItem[]) {
  const valid = z.array(foodItemSchema).min(1).max(8).parse(items);
  const sum = (key: "protein100" | "carbs100" | "fat100") =>
    valid.some((v) => v[key] === null)
      ? null
      : Math.round(valid.reduce((a, v) => a + (v[key]! * v.grams) / 100, 0));
  return {
    kcalLow: Math.round(valid.reduce((a, v) => a + (v.kcal100Low * v.grams) / 100, 0)),
    kcalHigh: Math.round(valid.reduce((a, v) => a + (v.kcal100High * v.grams) / 100, 0)),
    protein: sum("protein100"),
    carbs: sum("carbs100"),
    fat: sum("fat100"),
  };
}
export const nutritionReportSchema = z.object({
  source: z.enum(["photo-estimate", "manual"]),
  items: z.array(foodItemSchema).min(1).max(8),
  confirmed: z.literal(true),
  notes: z.array(z.string().max(240)).max(6).optional(),
});
export const foodAnalysisSchema = z.object({
  items: z.array(foodItemSchema).max(8),
  notes: z.array(z.string().max(240)).max(5),
  confidence: z.enum(["low", "medium"]),
});
export type FoodAnalysis = z.infer<typeof foodAnalysisSchema>;
