import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useGame } from "@/lib/game-state";
import { useWellness } from "@/lib/wellness/wellness-state";
import { checkInSchema } from "@/lib/wellness/validation";
import {
  emptyCheckIn,
  sectionsDone,
  EXERCISE_TYPES,
  MOOD_TAGS,
  QUALITY,
  SCHEDULE,
  BALANCE,
  MEALTIMES,
  BREAKS,
  LOAD,
  formatSleep,
  calculateDayScores,
  type CheckInInput,
} from "@/lib/wellness/checkin";
export const checkButton =
  "vp-label vp-press min-h-11 rounded-xl border-[3px] border-ink bg-yellow px-4 py-2 text-ink disabled:opacity-50";
const fieldClass = "mt-1 min-h-11 w-full rounded-xl border-2 border-ink bg-surface p-3 text-ink";
const titles = ["Move", "Sleep", "Fuel", "Recover", "Feel", "Your day at a glance"];
export function DailyCheckIn() {
  const w = useWellness();
  const { user, missions, aiMission } = useGame();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<CheckInInput>({ ...emptyCheckIn });
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    setOpen(false);
    setDraft({ ...emptyCheckIn, moodTags: [] });
    setStep(0);
    setError("");
  }, [w.day, user?.id]);
  const set = <K extends keyof CheckInInput>(key: K, value: CheckInInput[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const count = sectionsDone(w.input).filter(Boolean).length;
  const numeric = (key: keyof CheckInInput, label: string, max: number, fractional = false) => (
    <label className="block text-sm font-bold">
      {label}
      <input
        className={fieldClass}
        type="number"
        min={0}
        max={max}
        step={fractional ? "0.01" : "1"}
        value={(draft[key] as number) ?? ""}
        onChange={(e) => set(key, e.target.value === "" ? null : e.target.valueAsNumber)}
      />
    </label>
  );
  const choices = (key: keyof CheckInInput, label: string, options: string[]) => (
    <fieldset>
      <legend className="mb-2 text-sm font-bold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o, i) => (
          <button
            type="button"
            key={o}
            aria-pressed={draft[key] === i + 1}
            className={cn(checkButton, draft[key] === i + 1 ? "bg-cyan" : "bg-surface")}
            onClick={() => set(key, draft[key] === i + 1 ? null : i + 1)}
          >
            {o}
          </button>
        ))}
      </div>
    </fieldset>
  );
  const openForm = () => {
    setDraft(
      w.input ? { ...w.input, moodTags: [...w.input.moodTags] } : { ...emptyCheckIn, moodTags: [] },
    );
    setStep(0);
    setError("");
    setOpen(true);
  };
  const validate = () => {
    const parsed = checkInSchema.safeParse(draft);
    if (!parsed.success) {
      const names: Record<string, string> = {
        steps: "steps",
        activeMinutes: "active minutes",
        exerciseMinutes: "exercise minutes",
        sleepMinutes: "sleep duration",
        waterLiters: "water",
        energy: "energy",
        stress: "stress",
      };
      const field = String(parsed.error.issues[0]?.path[0] ?? "answer");
      setError(`Check ${names[field] ?? field}: ${parsed.error.issues[0]?.message}`);
      return false;
    }
    setError("");
    return true;
  };
  const save = async () => {
    if (!validate()) return;
    if (!sectionsDone(draft).some(Boolean)) {
      setError("Add at least one answer to build your view.");
      return;
    }
    try {
      const previous = w.scores.view;
      const next = calculateDayScores(
        checkInSchema.parse(draft),
        aiMission ? [...missions, aiMission] : missions,
      ).view;
      await w.save(draft);
      setOpen(false);
      toast.success("VIEW updated", {
        description:
          previous !== null && next !== null
            ? `Your VIEW changed ${next - previous >= 0 ? "+" : ""}${next - previous} points and now reflects today's check-in.`
            : "Your score now reflects today's check-in.",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save. Please retry.");
    }
  };
  return (
    <>
      <section className="vp-card vp-pop bg-surface p-5">
        <p className="vp-label">Today's check-in · {count} / 5</p>
        <h2 className="mt-2 text-2xl font-bold uppercase">
          {count === 5 ? "Today's view updated ✓" : "Build today's view"}
        </h2>
        <p className="my-3 text-sm">
          Give VIEW POINT FIT a quick snapshot of your day. You can skip questions and save a
          partial check-in.
        </p>
        {w.input && (
          <p className="mb-3 text-sm">
            {w.input.steps ?? "—"} steps · {formatSleep(w.input.sleepMinutes)} sleep ·{" "}
            {w.input.waterLiters ?? "—"} L water · Energy {w.input.energy ?? "—"}/5
          </p>
        )}
        {w.error ? (
          <p role="alert">
            {w.error}{" "}
            <button className={checkButton} onClick={w.reload}>
              Retry
            </button>
          </p>
        ) : (
          <button className={checkButton} disabled={w.loading} onClick={openForm}>
            {w.loading ? "Loading check-in…" : w.input ? "Edit check-in" : "Start 1-min check-in"}
          </button>
        )}
      </section>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!w.saving) setOpen(value);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto border-[3px] border-ink bg-background sm:max-w-xl">
          <DialogTitle className="text-2xl uppercase">{titles[step]}</DialogTitle>
          <DialogDescription>
            {step < 5
              ? `Step ${step + 1} of 5 · All answers are optional`
              : "Review your answers before updating your VIEW. Editing gives no extra XP."}
          </DialogDescription>
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (step === 5) void save();
              else if (validate()) setStep((s) => s + 1);
            }}
          >
            <fieldset disabled={w.saving} className="space-y-5">
              {step === 0 && (
                <>
                  {numeric("steps", "Steps (0–100,000)", 100000)}
                  {numeric("activeMinutes", "Active minutes (0–600)", 600)}
                  <fieldset>
                    <legend className="mb-2 text-sm font-bold">Did you exercise?</legend>
                    <div className="flex gap-2">
                      {[false, true].map((v) => (
                        <button
                          type="button"
                          key={String(v)}
                          aria-pressed={draft.exercised === v}
                          className={cn(
                            checkButton,
                            draft.exercised === v ? "bg-cyan" : "bg-surface",
                          )}
                          onClick={() => set("exercised", draft.exercised === v ? null : v)}
                        >
                          {v ? "Yes" : "No"}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  {draft.exercised && (
                    <>
                      {numeric("exerciseMinutes", "Exercise minutes (0–600)", 600)}
                      <label className="block text-sm font-bold">
                        Exercise type
                        <select
                          className={fieldClass}
                          value={draft.exerciseType ?? ""}
                          onChange={(e) =>
                            set(
                              "exerciseType",
                              e.target.value
                                ? (e.target.value as CheckInInput["exerciseType"])
                                : null,
                            )
                          }
                        >
                          <option value="">Optional</option>
                          {EXERCISE_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t === "pose" ? "Pose Coach" : t}
                            </option>
                          ))}
                        </select>
                      </label>
                    </>
                  )}
                  <p className="text-sm">
                    Everyday movement matters too. A formal workout is optional.
                  </p>
                </>
              )}
              {step === 1 && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-sm font-bold">
                      Sleep hours
                      <input
                        className={fieldClass}
                        type="number"
                        min="0"
                        max="24"
                        step="1"
                        value={
                          draft.sleepMinutes === null ? "" : Math.floor(draft.sleepMinutes / 60)
                        }
                        onChange={(e) =>
                          set(
                            "sleepMinutes",
                            e.target.value === ""
                              ? null
                              : e.target.valueAsNumber * 60 + ((draft.sleepMinutes ?? 0) % 60),
                          )
                        }
                      />
                    </label>
                    <label className="text-sm font-bold">
                      Sleep minutes
                      <input
                        className={fieldClass}
                        type="number"
                        min="0"
                        max="59"
                        step="1"
                        value={draft.sleepMinutes === null ? "" : draft.sleepMinutes % 60}
                        onChange={(e) =>
                          set(
                            "sleepMinutes",
                            e.target.value === ""
                              ? null
                              : Math.floor((draft.sleepMinutes ?? 0) / 60) * 60 +
                                  e.target.valueAsNumber,
                          )
                        }
                      />
                    </label>
                  </div>
                  {choices("sleepQuality", "How was your sleep?", QUALITY)}
                  {choices(
                    "sleepSchedule",
                    "Was your schedule close to your usual time?",
                    SCHEDULE,
                  )}
                </>
              )}
              {step === 2 && (
                <>
                  {choices("mealBalance", "How balanced did your meals feel?", BALANCE)}
                  {numeric("waterLiters", "Water in liters (0–10)", 10, true)}
                  {choices("mealConsistency", "Meal consistency", MEALTIMES)}
                  <p className="text-sm">
                    Water needs differ. This is a broad habit check-in, not a prescribed water
                    target.
                  </p>
                </>
              )}
              {step === 3 && (
                <>
                  {choices(
                    "recoveryFeeling",
                    "How recovered do you feel? 1 = very low, 5 = very good",
                    ["1", "2", "3", "4", "5"],
                  )}
                  {choices("breakFrequency", "Did you take breaks?", BREAKS)}
                  {choices("activityLoad", "Today was…", LOAD)}
                </>
              )}
              {step === 4 && (
                <>
                  <p className="vp-label">Self-reported wellness</p>
                  {choices("energy", "Energy · 1 = very low, 5 = very high", [
                    "1",
                    "2",
                    "3",
                    "4",
                    "5",
                  ])}
                  {choices("stress", "Stress · 1 = very low, 5 = very high", [
                    "1",
                    "2",
                    "3",
                    "4",
                    "5",
                  ])}
                  <fieldset>
                    <legend className="mb-2 text-sm font-bold">Today felt… choose up to two</legend>
                    <div className="flex flex-wrap gap-2">
                      {MOOD_TAGS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          aria-pressed={draft.moodTags.includes(t)}
                          disabled={!draft.moodTags.includes(t) && draft.moodTags.length >= 2}
                          className={cn(
                            checkButton,
                            draft.moodTags.includes(t) ? "bg-cyan" : "bg-surface",
                          )}
                          onClick={() =>
                            set(
                              "moodTags",
                              draft.moodTags.includes(t)
                                ? draft.moodTags.filter((x) => x !== t)
                                : [...draft.moodTags, t],
                            )
                          }
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </>
              )}
              {step === 5 && (
                <div className="space-y-3">
                  <CheckInSummary input={draft} />
                  <p className="text-sm">
                    Prototype wellness scoring — not a medical assessment. Missing answers are
                    excluded, never scored as zero.
                  </p>
                </div>
              )}
            </fieldset>
            {error && (
              <p role="alert" className="rounded-xl border-2 border-ink bg-pink/10 p-3 text-sm">
                {error}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={cn(checkButton, "bg-surface")}
                disabled={step === 0 || w.saving}
                onClick={() => {
                  setError("");
                  setStep((s) => s - 1);
                }}
              >
                Back
              </button>
              <button type="submit" className={checkButton} disabled={w.saving}>
                {w.saving
                  ? "Saving…"
                  : step === 5
                    ? "Update my view"
                    : step === 4
                      ? "Review check-in"
                      : "Next"}
              </button>
              {step < 5 && (
                <button
                  type="button"
                  className={cn(checkButton, "bg-surface")}
                  onClick={() => {
                    if (validate()) setStep(5);
                  }}
                >
                  Review & save partial
                </button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
export function CheckInSummary({ input: c }: { input: CheckInInput }) {
  const label = (items: string[], value: number | null) =>
    value === null ? "—" : items[value - 1];
  return (
    <dl className="space-y-3 text-sm">
      {[
        [
          "Move",
          `${c.steps ?? "—"} steps · ${c.activeMinutes ?? "—"} active min · Exercise: ${c.exercised === null ? "—" : c.exercised ? `${c.exerciseMinutes ?? "—"} min ${c.exerciseType ?? ""}` : "No"}`,
        ],
        [
          "Sleep",
          `${formatSleep(c.sleepMinutes)} · ${label(QUALITY, c.sleepQuality)} quality · Schedule: ${label(SCHEDULE, c.sleepSchedule)}`,
        ],
        [
          "Fuel",
          `${label(BALANCE, c.mealBalance)} meal balance · ${c.waterLiters ?? "—"} L · ${label(MEALTIMES, c.mealConsistency)}`,
        ],
        [
          "Recover",
          `${c.recoveryFeeling ?? "—"}/5 · Breaks: ${label(BREAKS, c.breakFrequency)} · ${label(LOAD, c.activityLoad)}`,
        ],
        [
          "Feel",
          `Energy ${c.energy ?? "—"}/5 · Stress ${c.stress ?? "—"}/5 · ${c.moodTags.join(", ") || "—"}`,
        ],
      ].map(([key, value]) => (
        <div key={key} className="rounded-xl border-2 border-ink bg-surface p-3">
          <dt className="vp-label">{key}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
