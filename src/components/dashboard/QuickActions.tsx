import { Link } from "@tanstack/react-router";
import { ArrowRight, Bot, Dumbbell, Rocket, Search, Trophy } from "lucide-react";
import { SectionHeader, toneFill } from "@/components/vp/ui";
import { cn } from "@/lib/utils";

const actions = [
  { to: "/fuel", title: "Fuel Log", sub: "Build a balanced plate", icon: Trophy, tone: "lime" },
  { to: "/pose", title: "Pose Coach", sub: "Check your movement", icon: Dumbbell, tone: "pink" },
  { to: "/coach", title: "AI Coach", sub: "Understand your habits", icon: Bot, tone: "cyan" },
  { to: "/lab", title: "Health Detective", sub: "Solve a case", icon: Search, tone: "lime" },
  {
    to: "/progress",
    title: "Your Progress",
    sub: "View achievements",
    icon: Trophy,
    tone: "yellow",
  },
] as const;

export function QuickActions() {
  return (
    <section>
      <SectionHeader
        kicker="Where next"
        title="Quick Actions"
        icon={<Rocket className="h-4 w-4" />}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {actions.map((a) => (
          <Link key={a.to} to={a.to} className="vp-card vp-pop vp-press flex flex-col gap-2 p-4">
            <span
              className={cn(
                "grid h-11 w-11 place-items-center rounded-xl border-[3px] border-ink",
                toneFill[a.tone],
              )}
            >
              <a.icon className="h-5 w-5" />
            </span>
            <p
              className="font-bold uppercase leading-tight text-ink"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {a.title}
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              {a.sub} <ArrowRight className="h-3 w-3 shrink-0" />
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
