import type { ReactNode } from "react";
import { Loader2, Lock, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tone } from "@/types";

/** Solid fill per tone, with readable text on top. */
export const toneFill: Record<Tone, string> = {
  yellow: "bg-yellow text-ink",
  pink: "bg-pink text-surface",
  cyan: "bg-cyan text-ink",
  lime: "bg-lime text-ink",
  purple: "bg-purple text-surface",
};

export const toneText: Record<Tone, string> = {
  yellow: "text-ink",
  pink: "text-pink",
  cyan: "text-cyan",
  lime: "text-lime",
  purple: "text-purple",
};

export function GameCard({
  children,
  className,
  tone,
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string | undefined;
  tone?: Tone;
  as?: "section" | "article" | "div";
}) {
  return (
    <Tag className={cn("vp-card vp-pop relative p-4 sm:p-5", tone && toneFill[tone], className)}>
      {children}
    </Tag>
  );
}

/** Back-compat alias */
export const Panel = GameCard;

export function SectionHeader({
  title,
  kicker,
  action,
  icon,
}: {
  title: string;
  kicker?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
      <div className="flex min-w-0 items-center gap-2">
        {icon ? (
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border-[3px] border-ink bg-yellow text-ink">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          {kicker ? <p className="vp-label text-muted-foreground">{kicker}</p> : null}
          <h2 className="truncate text-lg font-bold uppercase leading-tight text-ink sm:text-xl">
            {title}
          </h2>
        </div>
      </div>
      {action}
    </div>
  );
}

export const SectionTitle = SectionHeader;

export function StatusChip({
  children,
  tone = "muted",
  className,
  icon,
}: {
  children: ReactNode;
  tone?: Tone | "muted" | "white" | "ink";
  className?: string | undefined;
  icon?: ReactNode;
}) {
  const tones = {
    muted: "bg-surface-2 text-ink",
    white: "bg-surface text-ink",
    ink: "bg-ink text-yellow",
    ...toneFill,
  } as const;
  return (
    <span
      className={cn(
        "vp-label inline-flex items-center gap-1 rounded-full border-2 border-ink px-2.5 py-1 leading-none",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

export const Chip = StatusChip;

export function XPBar({
  value,
  max = 100,
  tone = "pink",
  className,
  size = "md",
}: {
  value: number;
  max?: number;
  tone?: Tone;
  className?: string | undefined;
  size?: "sm" | "md" | "lg";
}) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  const h = size === "sm" ? "h-2.5" : size === "lg" ? "h-5" : "h-3.5";
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-full border-2 border-ink bg-surface",
        h,
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full" style={{ width: `${pct}%` }}>
        <div
          className={cn(
            "animate-bar h-full origin-left border-r-2 border-ink",
            toneFill[tone],
            pct === 0 && "border-r-0",
          )}
        />
      </div>
    </div>
  );
}

export const ProgressBar = XPBar;

export function GameButton({
  children,
  tone = "yellow",
  disabled,
  onClick,
  type = "button",
  className,
}: {
  children: ReactNode;
  tone?: Tone | "white" | "ink";
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string | undefined;
}) {
  const tones = { white: "bg-surface text-ink", ink: "bg-ink text-yellow", ...toneFill } as const;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "vp-label vp-pop inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-[3px] border-ink px-5 py-3 text-sm",
        !disabled && "vp-press",
        tones[tone],
        disabled && "cursor-not-allowed opacity-60 shadow-none",
        className,
      )}
    >
      {children}
    </button>
  );
}

export const PopButton = GameButton;

export function LevelBadge({ level, className }: { level: number; className?: string }) {
  return (
    <span
      className={cn(
        "vp-label inline-flex items-center gap-1 rounded-lg border-2 border-ink bg-yellow px-2 py-1 text-ink",
        className,
      )}
    >
      <Star className="h-3.5 w-3.5 fill-current" /> Level {level}
    </span>
  );
}

export function Sticker({
  children,
  tone = "pink",
  className,
  rotate = -6,
}: {
  children: ReactNode;
  tone?: Tone | "ink";
  className?: string | undefined;
  rotate?: number;
}) {
  const tones = { ink: "bg-ink text-yellow", ...toneFill } as const;
  return (
    <span
      className={cn(
        "vp-label pointer-events-none inline-flex items-center gap-1 rounded-md border-2 border-ink px-2 py-0.5 shadow-[2px_2px_0_0_var(--ink)]",
        tones[tone],
        className,
      )}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </span>
  );
}

export function DemoTag({ className }: { className?: string }) {
  return (
    <StatusChip tone="white" className={cn("border-dashed", className)}>
      Demo data
    </StatusChip>
  );
}

export function XPTag({ xp, className }: { xp: number; className?: string }) {
  return (
    <StatusChip tone="ink" icon={<Zap className="h-3 w-3 fill-current" />} className={className}>
      +{xp} XP
    </StatusChip>
  );
}

export function LockedTag({ children = "Locked" }: { children?: ReactNode }) {
  return (
    <StatusChip tone="muted" icon={<Lock className="h-3 w-3" />}>
      {children}
    </StatusChip>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
  className?: string | undefined;
}) {
  return (
    <div
      className={cn(
        "vp-stripes flex flex-col items-center rounded-xl border-[3px] border-dashed border-ink bg-surface-2 px-4 py-6 text-center",
        className,
      )}
    >
      <span className="grid h-12 w-12 place-items-center rounded-xl border-[3px] border-ink bg-yellow text-ink shadow-[3px_3px_0_0_var(--ink)]">
        {icon}
      </span>
      <p
        className="mt-3 text-base font-bold uppercase text-ink"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/** Branded loading skeleton block. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "vp-stripes animate-pulse rounded-xl border-2 border-ink/30 bg-surface-2",
        className,
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="vp-card space-y-3 p-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}

export function LoadingBadge({ label = "Loading" }: { label?: string }) {
  return (
    <span className="vp-label inline-flex items-center gap-2 rounded-full border-2 border-ink bg-yellow px-3 py-1.5 text-ink">
      <Loader2 className="h-3.5 w-3.5 animate-spin" /> {label}
    </span>
  );
}

/** Small decorative shapes. Purely presentational. */
export function Deco({
  kind,
  className,
}: {
  kind: "star" | "cross" | "dot" | "bolt";
  className?: string | undefined;
}) {
  const base = cn("pointer-events-none absolute", className);
  if (kind === "dot")
    return <span aria-hidden className={cn(base, "h-3 w-3 rounded-full border-2 border-ink")} />;
  if (kind === "cross")
    return (
      <span aria-hidden className={cn(base, "text-xl font-bold leading-none")}>
        +
      </span>
    );
  if (kind === "bolt") return <Zap aria-hidden className={cn(base, "h-5 w-5 fill-current")} />;
  return <Star aria-hidden className={cn(base, "h-5 w-5 fill-current")} />;
}
