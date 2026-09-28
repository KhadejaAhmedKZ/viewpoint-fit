import type { CoachAgent } from "@/types";
import { cn } from "@/lib/utils";
import { agentIcons } from "./icons";
import { StatusChip, toneFill } from "./ui";

export function AgentCard({ agent }: { agent: CoachAgent }) {
  const Icon = agentIcons[agent.icon];
  return (
    <article className="vp-card vp-pop vp-lift h-full overflow-hidden">
      <div
        className={cn(
          "flex items-center gap-3 border-b-[3px] border-ink p-3",
          toneFill[agent.tone],
        )}
      >
        <span className="grid h-11 w-11 place-items-center rounded-full border-[3px] border-ink bg-surface text-ink">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="vp-label opacity-80">{agent.category}</p>
          <h3 className="truncate text-base font-bold uppercase">{agent.name}</h3>
        </div>
      </div>
      <div className="p-3">
        <StatusChip tone="white">{agent.specialty}</StatusChip>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{agent.description}</p>
      </div>
    </article>
  );
}
