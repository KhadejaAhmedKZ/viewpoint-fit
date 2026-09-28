import { supabase } from "@/integrations/supabase/client";
import { mealSchema, type Meal } from "./model";
import { today } from "@/lib/services/progressService";
export const fuelService = {
  async list(uid: string) {
    const { data, error } = await supabase
      .from("meal_logs")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error)
      throw new Error(
        "Fuel history is unavailable. Retry, or ask the project owner to apply the Fuel database update.",
      );
    return data as unknown as Meal[];
  },
  async save(uid: string, input: unknown) {
    const { nutrition_report, ...clean } = mealSchema.parse(input);
    const { data, error } = await supabase
      .from("meal_logs")
      .insert({
        ...clean,
        ...(nutrition_report ? { nutrition_report } : {}),
        user_id: uid,
        date: today(),
      })
      .select()
      .single();
    if (error)
      throw new Error(
        "Meal could not be saved. Your entry is still here; retry when the connection is ready.",
      );
    return data as unknown as Meal;
  },
};
