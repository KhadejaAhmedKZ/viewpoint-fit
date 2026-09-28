import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { TopHud } from "./TopHud";

export function AppLayout({
  title,
  subtitle,
  kicker,
  children,
}: {
  title: ReactNode;
  subtitle?: string;
  kicker?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen pb-28 md:pb-8">
      <TopHud />
      <div className="mx-auto w-full max-w-5xl px-4 pt-5 sm:pt-7">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            {kicker ? <p className="vp-label text-pink">{kicker}</p> : null}
            <h2 className="text-3xl font-bold uppercase leading-[0.95] tracking-tight text-ink sm:text-5xl">
              {title}
            </h2>
            {subtitle ? (
              <p className="vp-label mt-2 inline-block rounded-md border-2 border-ink bg-yellow px-2 py-1 text-ink">
                {subtitle}
              </p>
            ) : null}
          </div>
          <Link
            to="/profile"
            aria-label="Profile and settings"
            className="vp-pop vp-press grid h-11 w-11 shrink-0 place-items-center rounded-xl border-[3px] border-ink bg-surface text-ink"
          >
            <UserRound className="h-5 w-5" />
          </Link>
        </div>
        <main className="mt-6 space-y-6">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
