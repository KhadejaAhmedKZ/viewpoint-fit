import { characterMilestones } from "@/lib/planning/nextMove";
import { useEffect, useState } from "react";
import { Character3D } from "./Character3D";
import { avatarPreset } from "@/lib/characters/config";
import { useGame } from "@/lib/game-state";
export function PlayerCharacter() {
  const {
    user,
    profile,
    levelInfo,
    xpEvent,
    levelUp,
    streak,
    solvedCases,
    poseHistory,
    earnedBadges,
  } = useGame();
  const milestone = characterMilestones(
    solvedCases.length,
    poseHistory.length,
    earnedBadges.length,
  ).find((m) => m.unlocked && m.name === user?.user_metadata?.["view_title"]);
  const [celebrating, setCelebrating] = useState(false);
  useEffect(() => {
    if (!xpEvent) return;
    setCelebrating(true);
    const id = setTimeout(() => setCelebrating(false), 2500);
    return () => clearTimeout(id);
  }, [xpEvent]);
  return (
    <section className="vp-card vp-pop-lg vp-dots grid items-center overflow-hidden bg-yellow sm:grid-cols-2">
      <div style={milestone ? { borderBottom: `6px solid ${milestone.color}` } : undefined}>
        <Character3D
          preset={avatarPreset(user?.user_metadata?.["avatar"])}
          motion={levelUp || celebrating ? "celebrate" : streak >= 3 ? "greeting" : "idle"}
        />
      </div>
      <div className="p-5">
        {milestone && (
          <p className="vp-label rounded-xl border-2 border-ink bg-surface p-2">
            {milestone.name} ✓
          </p>
        )}
        <p className="vp-label">Your View · Level {levelInfo.level}</p>
        <h2 className="mt-2 text-3xl font-bold uppercase">
          {profile?.displayName || "Your next chapter"}
        </h2>
        <p className="mt-2 text-sm">Small habits. New perspectives. A stronger routine.</p>
        <p className="vp-label mt-4">See → Understand → Learn → Act → Improve</p>
      </div>
    </section>
  );
}
