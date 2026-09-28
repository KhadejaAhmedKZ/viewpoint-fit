import { Link } from "@tanstack/react-router";
import { Camera, House, MessageCircle, Search, Trophy } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: House, exact: true },
  { to: "/pose", label: "Pose", icon: Camera, exact: false },
  { to: "/coach", label: "Coach", icon: MessageCircle, exact: false },
  { to: "/lab", label: "Lab", icon: Search, exact: false },
  { to: "/progress", label: "Progress", icon: Trophy, exact: false },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] md:static md:mt-8 md:px-4">
      <ul className="vp-card vp-pop mx-auto grid w-full max-w-md grid-cols-5 gap-1 p-1.5 md:max-w-xl">
        {items.map(({ to, label, icon: Icon, exact }) => (
          <li key={to}>
            <Link
              to={to}
              activeOptions={{ exact }}
              className="group flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-transparent text-muted-foreground transition-colors data-[status=active]:animate-nav-pop data-[status=active]:border-ink data-[status=active]:bg-yellow data-[status=active]:text-ink"
            >
              <Icon className="h-5 w-5 transition-transform group-active:scale-90" />
              <span className="vp-label text-[0.58rem]">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
