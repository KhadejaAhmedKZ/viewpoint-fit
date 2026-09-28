import { nutritionReportSchema, foodTotals } from "@/lib/fuel/photo-model";
export function SavedFoodReport({ report }: { report: unknown }) {
  const parsed = nutritionReportSchema.safeParse(report);
  if (!parsed.success) return null;
  const t = foodTotals(parsed.data.items);
  return (
    <details className="mt-3">
      <summary className="cursor-pointer font-bold">
        Confirmed nutrition report · {t.kcalLow}–{t.kcalHigh} kcal
      </summary>
      <p className="text-xs">
        {parsed.data.source === "manual"
          ? "Calculated from entered values"
          : "Photo estimate, reviewed by user"}
        . Not a measured calorie count.
      </p>
      {parsed.data.notes?.map((note, index) => (
        <p key={index} className="text-xs">
          {note}
        </p>
      ))}
      {parsed.data.items.map((i, n) => (
        <p key={n} className="text-sm">
          {i.name} · {i.grams} g
        </p>
      ))}
      <p className="text-sm">
        Protein {t.protein ?? "unknown"} · Carbs {t.carbs ?? "unknown"} · Fat {t.fat ?? "unknown"}{" "}
        (grams when known)
      </p>
    </details>
  );
}
