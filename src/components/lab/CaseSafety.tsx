import { ShieldCheck } from "lucide-react";

export function FictionalTag() {
  return (
    <span className="vp-label inline-flex items-center gap-1 rounded-md border-2 border-dashed border-ink bg-surface px-2 py-1 text-ink">
      <ShieldCheck className="h-3.5 w-3.5" /> Fictional educational case
    </span>
  );
}

export function CaseSafety() {
  return (
    <aside className="rounded-xl border-2 border-ink bg-surface p-3 text-sm">
      <FictionalTag />
      <p className="mt-2 leading-relaxed text-muted-foreground">
        This case is designed for preventive wellness education. It does not provide medical
        diagnosis, treatment or prediction.
      </p>
    </aside>
  );
}
