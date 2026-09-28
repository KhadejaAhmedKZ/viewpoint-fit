import { characterMilestones } from "@/lib/planning/nextMove";
import { useState } from "react";
import { useGame } from "@/lib/game-state";
import { supabase } from "@/integrations/supabase/client";
import { avatarPreset, outfitPresets, type OutfitPreset } from "@/lib/characters/config";
import { Character3D } from "./Character3D";
import { checkButton } from "@/components/dashboard/DailyCheckIn";
export function AvatarChoice() {
  const { user, solvedCases, poseHistory, earnedBadges } = useGame();
  const milestones = characterMilestones(
    solvedCases.length,
    poseHistory.length,
    earnedBadges.length,
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const selected = avatarPreset(user?.user_metadata?.["avatar"]);
  const save = async (avatar: OutfitPreset) => {
    setBusy(true);
    setError("");
    try {
      const r = await supabase.auth.updateUser({ data: { avatar } });
      if (r.error) throw r.error;
    } catch {
      setError("Your outfit could not be saved. Please retry.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="vp-card vp-pop bg-surface p-4">
      <h2 className="text-xl font-bold uppercase">Your character</h2>
      <Character3D preset={selected} height={230} />
      <div className="flex flex-wrap justify-center gap-2">
        {Object.keys(outfitPresets).map((p) => (
          <button
            key={p}
            className={checkButton}
            aria-pressed={p === selected}
            disabled={busy}
            onClick={() => void save(p as OutfitPreset)}
          >
            {p}
            {p === selected ? " ✓" : ""}
          </button>
        ))}
      </div>
      <h3 className="mt-4 font-bold">Earned character titles</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {milestones.map((m) => (
          <button
            key={m.name}
            disabled={!m.unlocked || busy}
            aria-pressed={user?.user_metadata?.["view_title"] === m.name}
            className={checkButton}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                const result = await supabase.auth.updateUser({ data: { view_title: m.name } });
                if (result.error) throw result.error;
              } catch {
                setError("Title could not be saved. Please retry.");
              } finally {
                setBusy(false);
              }
            }}
          >
            {m.name}
            {m.unlocked ? "" : " · Locked"}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm">Your outfit is saved to your account profile.</p>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
