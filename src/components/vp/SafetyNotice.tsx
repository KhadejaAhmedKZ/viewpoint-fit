import { Info } from "lucide-react";
import { safetyNotice } from "@/data/mock";
import { cn } from "@/lib/utils";

export function SafetyNotice({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-xl border-2 border-ink bg-surface p-3 text-sm",
        className,
      )}
    >
      <Info className="mt-0.5 h-4 w-4 text-cyan" />
      <div>
        <p className="vp-label text-ink">{safetyNotice.title}</p>
        <p className="mt-1 leading-relaxed text-muted-foreground">{safetyNotice.body}</p>
      </div>
    </aside>
  );
}
