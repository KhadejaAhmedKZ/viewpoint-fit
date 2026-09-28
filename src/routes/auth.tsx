import { Character3D } from "@/components/characters/Character3D";
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Eye, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGame } from "@/lib/game-state";
import { Deco, GameButton, Sticker } from "@/components/vp/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — VIEW POINT FIT" },
      {
        name: "description",
        content:
          "Sign in or create your VIEW POINT FIT account to keep your XP, missions, Lab cases and Pose sessions.",
      },
      { property: "og:title", content: "Sign in — VIEW POINT FIT" },
      { property: "og:description", content: "See your health from every angle. Welcome, player." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const field =
  "min-h-12 w-full rounded-xl border-[3px] border-ink bg-surface px-3 text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-pink";

function AuthPage() {
  const { user } = useGame();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (user) void navigate({ to: "/", replace: true });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "up" && (name.trim().length < 2 || name.trim().length > 40))
      return setError("Display name must be 2–40 characters.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setBusy(true);
    try {
      if (mode === "in") {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err)
          setError(
            err.message === "Invalid login credentials"
              ? "Email or password is incorrect."
              : err.message,
          );
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin, data: { display_name: name.trim() } },
        });
        if (err) setError(err.message);
        else if (!data.session) setSent(true);
      }
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="vp-dots relative min-h-screen overflow-hidden bg-background px-4 py-10">
      <Deco kind="star" className="left-6 top-8 text-pink" />
      <Deco kind="dot" className="right-8 top-24 text-cyan" />
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="vp-pop mx-auto grid h-14 w-14 place-items-center rounded-2xl border-[3px] border-ink bg-yellow">
            <Eye className="h-7 w-7 text-ink" />
          </span>
          <h1 className="mt-3 text-4xl font-bold uppercase text-ink">VIEW POINT FIT</h1>
          <p className="vp-label mt-1 text-ink">See your health from every angle</p>
        </div>

        <Character3D motion="greeting" height={210} />
        <Link
          to="/demo"
          className="vp-label vp-pop mb-5 flex min-h-14 items-center justify-center rounded-xl border-[3px] border-ink bg-yellow text-ink"
        >
          Try demo · no account needed
        </Link>
        <section className="vp-card vp-pop-lg bg-surface p-5">
          <Sticker tone="yellow" rotate={-3}>
            Player 1
          </Sticker>
          <h2 className="mt-2 text-3xl font-bold uppercase text-ink">Welcome player</h2>

          {sent ? (
            <div className="mt-4 rounded-xl border-[3px] border-ink bg-lime/30 p-4 text-ink">
              <p className="flex items-center gap-2 font-bold uppercase">
                <MailCheck className="h-5 w-5" /> Check your email
              </p>
              <p className="mt-1 text-sm">
                We sent a confirmation link to {email}. Tap it, then come back and sign in.
              </p>
              <GameButton
                tone="white"
                className="mt-3 w-full"
                onClick={() => {
                  setSent(false);
                  setMode("in");
                }}
              >
                Back to sign in
              </GameButton>
            </div>
          ) : (
            <>
              <div
                className="mt-4 grid grid-cols-2 gap-2 rounded-xl border-[3px] border-ink bg-surface-2 p-1"
                role="tablist"
              >
                {(["in", "up"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => {
                      setMode(m);
                      setError(null);
                    }}
                    className={cn(
                      "vp-label min-h-10 rounded-lg text-ink",
                      mode === m && "border-2 border-ink bg-yellow",
                    )}
                  >
                    {m === "in" ? "Sign in" : "Create account"}
                  </button>
                ))}
              </div>
              <form onSubmit={submit} className="mt-4 space-y-3">
                {mode === "up" && (
                  <label className="block">
                    <span className="vp-label text-ink">Display name</span>
                    <input
                      className={field}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={40}
                      autoComplete="nickname"
                      required
                    />
                  </label>
                )}
                <label className="block">
                  <span className="vp-label text-ink">Email</span>
                  <input
                    className={field}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </label>
                <label className="block">
                  <span className="vp-label text-ink">Password</span>
                  <input
                    className={field}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    autoComplete={mode === "in" ? "current-password" : "new-password"}
                    required
                  />
                </label>
                {error && (
                  <p
                    role="alert"
                    className="rounded-lg border-2 border-ink bg-pink/15 p-2 text-sm text-ink"
                  >
                    {error}
                  </p>
                )}
                <GameButton tone="pink" type="submit" className="w-full" disabled={busy}>
                  {busy ? "One sec…" : "Start your journey"}
                </GameButton>
              </form>
            </>
          )}
        </section>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Preventive wellness education — not a medical service.
        </p>
      </div>
    </main>
  );
}
