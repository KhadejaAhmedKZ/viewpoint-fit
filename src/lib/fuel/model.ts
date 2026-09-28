import { nutritionReportSchema } from "./photo-model";
import { z } from "zod";
export const mealTypes = ["breakfast", "lunch", "dinner", "snack"] as const;
export const plateParts = ["protein", "color", "grains", "fats", "water"] as const;
export type PlatePart = (typeof plateParts)[number];
export const plateLabels: Record<PlatePart, string> = {
  protein: "Protein source",
  color: "Vegetables / fruit",
  grains: "Carbohydrate / grain",
  fats: "Fat source",
  water: "Water / hydration",
};
export const mealSchema = z.object({
  meal_type: z.enum(mealTypes),
  description: z.string().trim().min(2, "Describe your meal in at least two characters.").max(300),
  components: z.array(z.enum(plateParts)).max(5),
  nutrition_report: nutritionReportSchema.optional(),
});
export interface Meal {
  id: string;
  user_id: string;
  date: string;
  meal_type: (typeof mealTypes)[number];
  description: string;
  components: PlatePart[];
  created_at: string;
  nutrition_report?: z.infer<typeof nutritionReportSchema> | null;
}
export const foodIdeas = [
  { name: "Lentils / beans", parts: ["protein", "grains"] },
  { name: "Eggs", parts: ["protein", "fats"] },
  { name: "Yogurt", parts: ["protein"] },
  { name: "Chicken / fish", parts: ["protein"] },
  { name: "Rice / bread", parts: ["grains"] },
  { name: "Salad / vegetables", parts: ["color"] },
  { name: "Fruit", parts: ["color"] },
  { name: "Nuts / olive oil", parts: ["fats"] },
  { name: "Water", parts: ["water"] },
] as const;
export function mealFeedback(parts: PlatePart[]) {
  return [
    parts.includes("color")
      ? "Color present ✓ — fruit or vegetables logged."
      : "Add some color — consider fruit or vegetables if they fit your meal.",
    parts.includes("protein") ? "Protein present ✓" : "A protein source can add variety to a meal.",
    parts.includes("water")
      ? "Hydration noted ✓"
      : "Hydration check — notice your water habits across the day.",
  ];
}
