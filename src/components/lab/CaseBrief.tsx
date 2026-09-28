import { Character3D } from "@/components/characters/Character3D";
import { useState } from "react";
import { FolderOpen, Target, Trophy, UserRound } from "lucide-react";
import type { HealthCase } from "@/types/cases";
import { GameButton, StatusChip, Sticker } from "@/components/vp/ui";
import { FictionalTag } from "./CaseSafety";
import { DifficultyChip } from "./DifficultyChip";

/** Dossier cover → story → open case file. */
export function CaseBrief({ c, onStart }: { c: HealthCase; onStart: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="vp-card vp-pop-lg relative overflow-hidden">
      <div className="flex items-center justify-between border-b-[3px] border-ink bg-yellow px-4 py-2">
        <span className="vp-label text-ink">Case #{c.id}</span>
        <DifficultyChip difficulty={c.difficulty} />
      </div>
      <div className="vp-dots space-y-4 p-5">
        <FictionalTag />
        <Character3D
          character={c.id === "001" ? "khalid" : c.id === "002" ? "sara" : "omar"}
          height={240}
        />
        <h3
          className="text-3xl font-bold uppercase leading-none text-ink"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {c.title}
        </h3>
        <div className="flex flex-wrap gap-2">
          <StatusChip tone="white" icon={<UserRound className="h-3 w-3" />}>
            {c.character.name} • Age {c.character.age}
          </StatusChip>
          <StatusChip tone="ink" icon={<Trophy className="h-3 w-3" />}>
            Reward: up to {c.maxXP} XP
          </StatusChip>
        </div>
        <p className="text-sm font-bold uppercase text-muted-foreground">{c.themes.join(" • ")}</p>

        <blockquote className="relative rounded-xl border-[3px] border-ink bg-pink p-4 text-lg font-bold italic leading-snug text-surface shadow-[4px_4px_0_0_var(--ink)]">
          “{c.character.question}”
        </blockquote>

        <div className="rounded-xl border-[3px] border-ink bg-surface p-4">
          <p className="vp-label flex items-center gap-2 text-pink">
            <Target className="h-4 w-4" /> Mission
          </p>
          <p className="mt-1 font-bold text-ink">{c.mission}</p>
        </div>

        {open ? (
          <div className="animate-fade-in space-y-2 rounded-xl border-[3px] border-ink bg-surface p-4 text-sm leading-relaxed text-ink">
            {c.character.story.map((p) => (
              <p key={p} className={p.includes("NOT") ? "font-bold" : undefined}>
                {p}
              </p>
            ))}
          </div>
        ) : null}

        {open ? (
          <GameButton tone="pink" onClick={onStart} className="w-full">
            {c.startLabel ?? "Start investigation"}
          </GameButton>
        ) : (
          <GameButton onClick={() => setOpen(true)} className="w-full">
            <FolderOpen className="h-4 w-4" /> Open case file
          </GameButton>
        )}
      </div>
      <Sticker tone="ink" rotate={6} className="absolute right-3 top-12">
        Top secret
      </Sticker>
    </section>
  );
}
