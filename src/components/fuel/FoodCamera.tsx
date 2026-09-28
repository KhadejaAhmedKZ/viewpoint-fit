import { mealTypes } from "@/lib/fuel/model";
import { useServerFn } from "@tanstack/react-start";
import { analyzeMeal, getFoodProvider } from "@/lib/fuel/photo.functions";
import { prepareFoodPhoto } from "@/lib/fuel/photo-client";
import { useEffect, useRef, useState } from "react";
import { useFuel } from "@/lib/fuel/fuel-state";
import { useGame } from "@/lib/game-state";
import { foodItemSchema, foodTotals, type FoodItem } from "@/lib/fuel/photo-model";
import { GameButton } from "@/components/vp/ui";
const blank = {
  name: "",
  grams: "",
  kcal100Low: "",
  kcal100High: "",
  protein100: "",
  carbs100: "",
  fat100: "",
};
export function FoodCamera() {
  const { user } = useGame();
  const fuel = useFuel();
  const [photo, setPhoto] = useState(""),
    [items, setItems] = useState<FoodItem[]>([]),
    [draft, setDraft] = useState(blank),
    [error, setError] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [saved, setSaved] = useState(false),
    [busy, setBusy] = useState(false);
  const [mealType, setMealType] = useState<(typeof mealTypes)[number]>("lunch");
  const analyze = useServerFn(analyzeMeal);
  const [provider, setProvider] = useState<"gemini" | "lovable" | null>(null);
  useEffect(() => {
    let live = true;
    void getFoodProvider()
      .then((r) => {
        if (live) setProvider(r.provider);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  const destination =
    provider === "gemini"
      ? "Google Gemini (generativelanguage.googleapis.com)"
      : provider === "lovable"
        ? "Lovable AI (ai.gateway.lovable.dev)"
        : "the AI provider (loading)";
  const fileRef = useRef<File | null>(null),
    request = useRef(0);
  const [consent, setConsent] = useState(false),
    [analyzing, setAnalyzing] = useState(false),
    [source, setSource] = useState<"manual" | "photo-estimate">("manual"),
    [notes, setNotes] = useState<string[]>([]);
  useEffect(
    () => () => {
      request.current++;
    },
    [],
  );
  const runPhoto = async () => {
    if (!user || !fileRef.current || !consent || !provider || analyzing) return;
    const seq = ++request.current;
    setAnalyzing(true);
    setError("");
    try {
      const image = await prepareFoodPhoto(fileRef.current);
      if (seq !== request.current) return;
      const result = await analyze({ data: { image, consent: true, provider } });
      if (seq !== request.current) return;
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setItems(result.report.items);
      setNotes([
        `Photo estimate · ${result.report.confidence} confidence. Not a measurement.`,
        ...result.report.notes,
      ]);
      setSource("photo-estimate");
      setConfirmed(false);
      setSaved(false);
      if (!result.report.items.length)
        setError("No identifiable food. Try another food photo or add items manually.");
    } catch {
      if (seq === request.current)
        setError("Photo AI is unavailable. You can calculate your meal manually below.");
    } finally {
      if (seq === request.current) setAnalyzing(false);
    }
  };
  const objectUrl = useRef("");
  useEffect(
    () => () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    },
    [],
  );
  const clear = () => {
    request.current++;
    fileRef.current = null;
    setConsent(false);
    setAnalyzing(false);
    setSource("manual");
    setNotes([]);
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = "";
    setPhoto("");
    setBusy(false);
    setItems([]);
    setDraft(blank);
    setConfirmed(false);
    setSaved(false);
    setError("");
  };
  useEffect(() => {
    clear();
  }, [user?.id]);
  const choose = (file: File | undefined) => {
    if (!file) return;
    setError("");
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 8 * 1024 * 1024
    ) {
      setError("Choose a JPEG, PNG or WebP photo under 8 MB.");
      return;
    }
    clear();
    fileRef.current = file;
    objectUrl.current = URL.createObjectURL(file);
    setPhoto(objectUrl.current);
  };
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length >= 8) return;
    const parsed = foodItemSchema.safeParse({
      ...draft,
      grams: draft.grams === "" ? NaN : Number(draft.grams),
      kcal100Low: draft.kcal100Low === "" ? NaN : Number(draft.kcal100Low),
      kcal100High: draft.kcal100High === "" ? Number(draft.kcal100Low) : Number(draft.kcal100High),
      protein100: draft.protein100 === "" ? null : Number(draft.protein100),
      carbs100: draft.carbs100 === "" ? null : Number(draft.carbs100),
      fat100: draft.fat100 === "" ? null : Number(draft.fat100),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Review the portion and values.");
      return;
    }
    setItems((v) => [...v, parsed.data]);
    setDraft(blank);
    setConfirmed(false);
    setSaved(false);
    setError("");
  };
  const totals = items.length ? foodTotals(items) : null;
  const save = async () => {
    if (!confirmed || !totals) return;
    const seq = request.current;
    setBusy(true);
    setError("");
    try {
      await fuel.save({
        meal_type: mealType,
        description: `Food report: ${items.map((i) => i.name).join(", ")}`.slice(0, 300),
        components: [],
        nutrition_report: { source, items, confirmed: true, notes },
      });
      if (seq !== request.current) return;
      setSaved(true);
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = "";
      fileRef.current = null;
      setPhoto("");
      setConsent(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save your report.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="vp-card vp-pop bg-surface p-5">
      <fieldset disabled={busy} className="space-y-4">
        <p className="vp-label">Food lens · portion calculator</p>
        <h2 className="text-3xl font-bold uppercase">Picture your plate</h2>
        <p className="text-sm">
          Take a food photo as a reference, then confirm the foods and portions. Use opt-in AI for
          an estimate, or enter package nutrition values manually. A photo cannot reveal exact
          portions, recipes or hidden ingredients.
        </p>
        <label className="block rounded-xl border-[3px] border-ink bg-yellow p-4 font-bold">
          Take or choose a food photo
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={(e) => {
              choose(e.target.files?.[0]);
              e.target.value = "";
            }}
            className="mt-2 block w-full text-sm"
          />
        </label>
        <p className="text-xs">
          Your photo stays local until you consent and tap Analyze. VIEW POINT FIT does not save it.
          The resized image is sent to {destination}; its provider data policies apply.
        </p>
        {photo && (
          <>
            <img
              src={photo}
              alt="Your food photo, used locally as a portion reference"
              className="max-h-64 w-full rounded-xl border-2 border-ink object-contain"
            />
            <GameButton tone="white" onClick={clear}>
              Remove photo and clear report
            </GameButton>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              I agree to send this resized food photo to {destination} for analysis.
            </label>
            <GameButton
              disabled={!user || !consent || !provider || analyzing}
              onClick={() => void runPhoto()}
            >
              {analyzing ? "Analyzing food…" : user ? "Analyze food photo" : "Sign in for photo AI"}
            </GameButton>
          </>
        )}
        <form onSubmit={add} className="space-y-3">
          <h3 className="text-xl font-bold">Confirm foods and portions</h3>
          <label className="block font-bold">
            Meal type
            <select
              value={mealType}
              onChange={(e) => {
                setMealType(e.target.value as typeof mealType);
                setSaved(false);
              }}
              className="ml-2 rounded-xl border-2 border-ink p-2"
            >
              {mealTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <p className="text-sm">
            Use a package label or a trusted food database. Enter edible grams, including sauces and
            oils. Leave unknown macros blank.
          </p>
          <a
            href="https://fdc.nal.usda.gov/"
            target="_blank"
            rel="noreferrer"
            className="text-sm underline"
          >
            Look up nutrition in USDA FoodData Central
          </a>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries({
              name: "Food name",
              grams: "Portion weight (g)",
              kcal100Low: "Calories per 100 g",
              kcal100High: "Upper calories per 100 g (optional range)",
              protein100: "Protein per 100 g (optional)",
              carbs100: "Carbohydrate per 100 g (optional)",
              fat100: "Fat per 100 g (optional)",
            }).map(([key, label]) => (
              <label key={key} className="block text-sm font-bold">
                {label}
                <input
                  type={key === "name" ? "text" : "number"}
                  min="0"
                  step="any"
                  value={draft[key as keyof typeof draft]}
                  onChange={(e) => setDraft((v) => ({ ...v, [key]: e.target.value }))}
                  required={["name", "grams", "kcal100Low"].includes(key)}
                  maxLength={key === "name" ? 80 : undefined}
                  className="mt-1 min-h-11 w-full rounded-xl border-2 border-ink p-2"
                />
              </label>
            ))}
          </div>
          <GameButton type="submit" disabled={items.length >= 8}>
            Add food to report
          </GameButton>
        </form>
        {totals && (
          <div className="space-y-3 rounded-xl border-[3px] border-ink bg-cream p-4">
            <h3 className="text-xl font-bold">Your food report</h3>
            <p className="vp-label">
              {source === "photo-estimate"
                ? "AI estimate · review required"
                : "Calculated from your entries"}
            </p>
            {notes.map((n) => (
              <p className="text-sm" key={n}>
                {n}
              </p>
            ))}
            {items.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div>
                  <p>{item.name}</p>
                  <label className="text-sm">
                    Confirm grams
                    <input
                      aria-label={`Grams for ${item.name}`}
                      type="number"
                      min="1"
                      max="3000"
                      value={item.grams}
                      onChange={(e) => {
                        const grams = Number(e.target.value);
                        if (grams >= 1 && grams <= 3000) {
                          setItems((v) =>
                            v.map((row, index) => (index === i ? { ...row, grams } : row)),
                          );
                          setConfirmed(false);
                          setSaved(false);
                        }
                      }}
                      className="ml-2 w-24 rounded-lg border-2 border-ink p-2"
                    />
                  </label>
                  <button
                    className="ml-2 underline"
                    onClick={() => {
                      setDraft(
                        Object.fromEntries(
                          Object.entries(item).map(([key, value]) => [
                            key,
                            value === null ? "" : String(value),
                          ]),
                        ) as typeof blank,
                      );
                      setItems((v) => v.filter((_, index) => index !== i));
                      setConfirmed(false);
                      setSaved(false);
                    }}
                  >
                    Edit food
                  </button>
                </div>
                <button
                  className="min-h-11 underline"
                  onClick={() => {
                    setItems((v) => v.filter((_, index) => index !== i));
                    setConfirmed(false);
                    setSaved(false);
                  }}
                >
                  Remove <span className="sr-only">{item.name}</span>
                </button>
              </div>
            ))}
            <p className="text-3xl font-bold">
              {totals.kcalLow === totals.kcalHigh
                ? totals.kcalLow
                : `${totals.kcalLow}–${totals.kcalHigh}`}{" "}
              kcal
            </p>
            <p>
              Protein: {totals.protein ?? "unknown"}
              {totals.protein !== null ? " g" : ""} · Carbs: {totals.carbs ?? "unknown"}
              {totals.carbs !== null ? " g" : ""} · Fat: {totals.fat ?? "unknown"}
              {totals.fat !== null ? " g" : ""}
            </p>
            <p className="text-xs">
              Calculated from your entries; portion and recipe uncertainty remains. A range is not a
              statistical confidence interval. This is not an allergen check or a calorie target.
              Steps are not subtracted from food calories.
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              I reviewed the foods, portions and nutrition values.
            </label>
            <GameButton disabled={!user || !confirmed || busy || saved} onClick={() => void save()}>
              {saved
                ? "Report saved"
                : user
                  ? "Save confirmed report"
                  : "Sign in to save this report"}
            </GameButton>
          </div>
        )}
        {error && (
          <p role="alert" className="rounded-xl border-2 border-ink bg-pink/10 p-3">
            {error}
          </p>
        )}
      </fieldset>
    </section>
  );
}
