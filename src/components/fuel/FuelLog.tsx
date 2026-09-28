import { SavedFoodReport } from "./SavedFoodReport";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useFuel } from "@/lib/fuel/fuel-state";
import {
  mealTypes,
  plateParts,
  plateLabels,
  foodIdeas,
  mealFeedback,
  mealSchema,
  type PlatePart,
} from "@/lib/fuel/model";
import { checkButton } from "@/components/dashboard/DailyCheckIn";
import { cn } from "@/lib/utils";
export function FuelLog() {
  const f = useFuel();
  const [type, setType] = useState<(typeof mealTypes)[number]>("lunch"),
    [description, setDescription] = useState(""),
    [components, setComponents] = useState<PlatePart[]>([]),
    [query, setQuery] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const data = mealSchema.safeParse({ meal_type: type, description, components });
    if (!data.success) {
      setError(data.error.issues[0]?.message ?? "Review your entry.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await f.save(data.data);
      setDescription("");
      setComponents([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-5">
      <section className="vp-card vp-pop bg-yellow p-5">
        <h2 className="text-3xl font-bold uppercase">Fuel your day</h2>
        <p className="mt-2">No perfect plates. Notice what supports your routine.</p>
        <p className="mt-2 text-sm">
          Your Fuel score uses your daily check-in. Meal notes add context for Maya; they do not
          automatically grade a meal or change your score.
        </p>
        <Link to="/" className="vp-label mt-3 inline-block underline">
          Update today's Fuel check-in
        </Link>
      </section>
      <form onSubmit={submit} className="vp-card vp-pop space-y-4 bg-surface p-4">
        <h2 className="text-xl font-bold uppercase">Log a meal</h2>
        <fieldset disabled={busy} className="space-y-4">
          <label className="block vp-label">
            Meal type
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="mt-2 block min-h-11 w-full rounded-xl border-2 border-ink bg-cream p-2"
            >
              {mealTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block vp-label">
            What did you have?
            <textarea
              value={description}
              maxLength={300}
              required
              onChange={(e) => setDescription(e.target.value)}
              placeholder="For example, rice, lentils and salad"
              className="mt-2 min-h-24 w-full rounded-xl border-2 border-ink bg-cream p-3 text-sm normal-case"
            />
          </label>
          <fieldset>
            <legend className="vp-label mb-2">Your plate · optional</legend>
            <div className="flex flex-wrap gap-2">
              {plateParts.map((p) => (
                <button
                  type="button"
                  key={p}
                  aria-pressed={components.includes(p)}
                  onClick={() =>
                    setComponents((c) => (c.includes(p) ? c.filter((x) => x !== p) : [...c, p]))
                  }
                  className={cn(checkButton, components.includes(p) ? "bg-cyan" : "bg-surface")}
                >
                  {plateLabels[p]}
                </button>
              ))}
            </div>
          </fieldset>
          <details>
            <summary className="vp-label cursor-pointer">Find a food idea</summary>
            <p className="my-2 text-xs">
              A small built-in list, not a live food database. You can always type your own meal.
            </p>
            <label className="block text-sm">
              Search ideas
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="ml-2 min-h-10 max-w-full rounded-lg border-2 border-ink p-2"
              />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              {foodIdeas
                .filter((i) => i.name.toLowerCase().includes(query.toLowerCase()))
                .map((i) => (
                  <button
                    type="button"
                    key={i.name}
                    className={cn(checkButton, "bg-cream")}
                    onClick={() => {
                      setDescription((d) => [d, i.name].filter(Boolean).join(", ").slice(0, 300));
                      setComponents((c) => [...new Set([...c, ...i.parts])]);
                    }}
                  >
                    {i.name}
                  </button>
                ))}
            </div>
          </details>
          {components.length > 0 && (
            <ul className="space-y-2 rounded-xl border-2 border-ink bg-lime/20 p-3 text-sm">
              {mealFeedback(components).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
          <button className={checkButton} type="submit">
            {busy ? "Saving…" : "Save meal"}
          </button>
        </fieldset>
        {error && <p role="alert">{error}</p>}
      </form>
      <section className="vp-card vp-pop bg-surface p-4">
        <h2 className="text-xl font-bold uppercase">Your Fuel log</h2>
        {f.loading && <p role="status">Loading meals…</p>}
        {f.error && (
          <p role="alert" className="mt-3">
            {f.error}{" "}
            <button className={checkButton} onClick={f.reload}>
              Retry
            </button>
          </p>
        )}
        {!f.loading && !f.error && !f.meals.length && (
          <p className="mt-3">Your first meal starts the log.</p>
        )}
        <div className="mt-4 space-y-3">
          {f.meals.map((m) => (
            <article key={m.id} className="rounded-xl border-2 border-ink bg-cream p-3">
              <p className="vp-label">
                {m.date} · {m.meal_type}
              </p>
              <p className="my-2 break-words">{m.description}</p>
              <p className="text-xs">
                {m.components.map((p) => plateLabels[p]).join(" · ") ||
                  "No plate components selected"}
              </p>
              <SavedFoodReport report={m.nutrition_report} />
              <Link
                to="/coach"
                search={{ question: "Help me understand my recent meals without calorie targets." }}
                className="vp-label mt-3 inline-block underline"
              >
                Ask Maya about my meals
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
