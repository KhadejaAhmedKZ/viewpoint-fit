import { AvatarChoice } from "@/components/characters/AvatarChoice";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CalendarDays,
  Info,
  LogOut,
  Mail,
  Palette,
  Pencil,
  Star,
  UserRound,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useGame } from "@/lib/game-state";
import { AppLayout } from "@/components/vp/AppLayout";
import { AvatarFigure } from "@/components/vp/AvatarCard";
import { SafetyNotice } from "@/components/vp/SafetyNotice";
import { GameButton, GameCard, SectionHeader, StatusChip, Sticker } from "@/components/vp/ui";
import { appMeta, profileSettings } from "@/data/mock";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — VIEW POINT FIT" },
      {
        name: "description",
        content: "Your view: name, wellness goal, activities, language, notifications and privacy.",
      },
      { property: "og:title", content: "Profile — VIEW POINT FIT" },
      { property: "og:description", content: "Manage your VIEW POINT FIT player settings." },
    ],
  }),
  component: ProfilePage,
});

function Row({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl border-2 border-ink bg-surface p-3">
      <span className="grid h-9 w-9 place-items-center rounded-lg border-2 border-ink bg-yellow text-ink">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="vp-label text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-bold text-ink">{value}</p>
      </div>
    </div>
  );
}

function AccountSection() {
  const { user, profile, levelInfo, xp, rename, signOut } = useGame();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.displayName ?? "");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    const n = name.trim();
    if (n.length < 2 || n.length > 40) {
      toast.error("Name must be 2–40 characters.");
      return;
    }
    setSaving(true);
    try {
      await rename(n);
      setEditing(false);
      toast.success("Name updated");
    } catch {
      toast.error("Sync issue", { description: "Your name couldn't be saved. Try again." });
    } finally {
      setSaving(false);
    }
  };
  const since = profile
    ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : "—";
  return (
    <>
      <section>
        <SectionHeader kicker="Player" title="Your View" icon={<UserRound className="h-4 w-4" />} />
        <GameCard className="flex items-center gap-4">
          <div className="shrink-0 rounded-2xl border-[3px] border-ink bg-yellow p-1">
            <AvatarFigure size={64} />
          </div>
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="flex flex-wrap gap-2">
                <label className="sr-only" htmlFor="name-edit">
                  Display name
                </label>
                <input
                  id="name-edit"
                  value={name}
                  maxLength={40}
                  onChange={(e) => setName(e.target.value)}
                  className="min-h-10 min-w-0 flex-1 rounded-lg border-[3px] border-ink bg-surface px-2 font-bold text-ink"
                />
                <GameButton
                  tone="lime"
                  onClick={save}
                  disabled={saving}
                  className="min-h-10 px-3 py-2"
                >
                  Save
                </GameButton>
                <GameButton
                  tone="white"
                  onClick={() => {
                    setEditing(false);
                    setName(profile?.displayName ?? "");
                  }}
                  className="min-h-10 px-3 py-2"
                >
                  Cancel
                </GameButton>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="truncate text-2xl font-bold uppercase text-ink">
                  {profile?.displayName}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setName(profile?.displayName ?? "");
                    setEditing(true);
                  }}
                  className="vp-label vp-press inline-flex min-h-9 items-center gap-1 rounded-lg border-2 border-ink bg-surface px-2 text-ink"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit name
                </button>
              </div>
            )}
            <p className="vp-label mt-1 text-muted-foreground">
              Level {levelInfo.level} · {levelInfo.title}
            </p>
          </div>
        </GameCard>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <Row icon={Mail} label="Email" value={user?.email ?? "—"} />
          <Row icon={Star} label="Level" value={`${levelInfo.level} — ${levelInfo.title}`} />
          <Row icon={Zap} label="Total XP" value={`${xp} XP`} />
          <Row icon={CalendarDays} label="Member since" value={since} />
        </div>
      </section>
      <section>
        <SectionHeader kicker="Settings" title="Account" icon={<LogOut className="h-4 w-4" />} />
        <GameCard>
          <p className="text-sm text-ink">
            Signing out keeps all your progress saved for next time.
          </p>
          <GameButton
            tone="pink"
            className="mt-3 w-full"
            onClick={async () => {
              await signOut();
              void navigate({ to: "/auth", replace: true });
            }}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </GameButton>
        </GameCard>
      </section>
    </>
  );
}

function ProfilePage() {
  return (
    <AppLayout title="Profile" subtitle="Player settings">
      <AccountSection />
      <AvatarChoice />

      <section>
        <SectionHeader
          kicker="Customize"
          title="Your Style"
          icon={<Palette className="h-4 w-4" />}
        />
        <GameCard className="vp-grid flex items-center gap-4">
          <AvatarFigure size={88} />
          <div className="min-w-0">
            <Sticker tone="pink" rotate={-3}>
              Coming soon
            </Sticker>
            <p className="mt-2 text-sm text-ink">
              Unlock outfits, colors and gear for your avatar as you level up.
            </p>
          </div>
        </GameCard>
      </section>

      <section>
        <SectionHeader
          kicker="Info"
          title={`About ${appMeta.name}`}
          icon={<Info className="h-4 w-4" />}
        />
        <GameCard tone="cyan">
          <p className="text-sm leading-relaxed text-ink">{profileSettings.about}</p>
          <p className="mt-3 font-bold text-ink">{appMeta.tagline}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {appMeta.philosophy.map((p) => (
              <StatusChip key={p} tone="white">
                {p}
              </StatusChip>
            ))}
          </div>
        </GameCard>
      </section>

      <SafetyNotice />
    </AppLayout>
  );
}
