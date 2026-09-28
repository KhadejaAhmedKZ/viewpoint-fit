import { Character3D } from "@/components/characters/Character3D";
import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Compass, Eye, MessageSquarePlus, SendHorizontal, Users, WifiOff } from "lucide-react";
import { AppLayout } from "@/components/vp/AppLayout";
import { AvatarFigure } from "@/components/vp/AvatarCard";
import { SafetyNotice } from "@/components/vp/SafetyNotice";
import { Deco, GameButton, SectionHeader, StatusChip, Sticker, toneFill } from "@/components/vp/ui";
import {
  CrewCard,
  ErrorCard,
  NoticeCard,
  PlainCard,
  ReplyCard,
  agentIcons,
} from "@/components/coach/ReplyCards";
import { AGENT_IDS, agents } from "@/lib/coach/agents";
import { useCoach } from "@/lib/coach/coach-state";
import { quickGuidance, todaysView } from "@/lib/coach/guidance";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/coach")({
  validateSearch: (search: Record<string, unknown>): { question?: string } =>
    typeof search["question"] === "string" ? { question: search["question"].slice(0, 1000) } : {},
  head: () => ({
    meta: [
      { title: "VIEW POINT AI — Chat with Coach Maya" },
      {
        name: "description",
        content:
          "Ask Coach Maya about your movement, food, sleep and recovery. One coach, six specialist perspectives, using your in-app data.",
      },
      { property: "og:title", content: "VIEW POINT AI — Chat with Coach Maya" },
      {
        property: "og:description",
        content:
          "One coach. Multiple perspectives. Wellness education built on your VIEW POINT FIT data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CoachPage,
});

function CoachPage() {
  const {
    messages,
    pending,
    snapshot,
    send,
    retry,
    newChat,
    recents,
    conversationId,
    openChat: openThread,
  } = useCoach();
  const { question } = Route.useSearch();
  const [text, setText] = useState(question ?? "");
  useEffect(() => {
    if (question) setText(question);
  }, [question]);
  const [guidance, setGuidance] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const view = todaysView(snapshot);
  const offline =
    messages.at(-1)?.role === "maya" && (messages.at(-1) as { kind?: string }).kind === "error";

  useEffect(() => {
    if (messages.length || pending)
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, pending]);

  const submit = (t: string) => {
    if (pending || !t.trim()) return;
    void send(t);
    setText("");
    inputRef.current?.focus();
  };
  const openChat = () => {
    document.getElementById("coach-chat")?.scrollIntoView({ behavior: "smooth" });
    inputRef.current?.focus({ preventScroll: true });
  };

  const prompts = [
    snapshot.viewScore !== null
      ? `Why is my VIEW Score ${snapshot.viewScore}?`
      : "Why is my VIEW Score what it is?",
    "How can I move more today?",
    "Explain my sleep score",
    "What did Case #002 teach me?",
    "What should I focus on today?",
  ];

  return (
    <AppLayout
      title="VIEW POINT AI"
      subtitle="Your wellness crew"
      kicker="One coach. Multiple perspectives."
    >
      {view && (
        <section className={cn("vp-card vp-pop p-4", toneFill[view.tone])}>
          <p className="vp-label flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" /> Today's view
          </p>
          <h2 className="text-2xl font-bold uppercase leading-tight">{view.headline}</h2>
          <p className="text-sm">{view.body}</p>
          <GameButton
            tone="white"
            className="mt-3"
            onClick={() => {
              submit(view.ask);
              openChat();
            }}
            disabled={!!pending}
          >
            Ask Maya why
          </GameButton>
        </section>
      )}

      <section className="vp-card vp-pop-lg vp-dots relative overflow-hidden bg-pink p-5">
        <Deco
          kind="star"
          className="right-5 top-5 text-yellow drop-shadow-[1px_1px_0_var(--ink)]"
        />
        <div className="flex items-center gap-4">
          <div className="shrink-0 rounded-2xl border-[3px] border-ink bg-yellow p-1">
            <div className="w-40 shrink-0">
              <Character3D
                character="maya"
                portrait
                height={190}
                motion={pending ? "thinking" : "greeting"}
              />
            </div>
          </div>
          <div className="min-w-0">
            <Sticker tone="yellow" rotate={-3}>
              AI wellness guide
            </Sticker>
            <h2 className="mt-2 text-3xl font-bold uppercase text-surface">Coach Maya</h2>
          </div>
        </div>
        <p className="mt-4 rounded-xl border-[3px] border-ink bg-surface p-3 text-sm text-ink">
          Hey 👋 I'm Maya. I can help you understand your movement, food, sleep, recovery and
          wellness habits — and explain the why behind them.
        </p>
        <GameButton tone="yellow" className="mt-4 w-full" onClick={openChat}>
          Start chat
        </GameButton>
      </section>

      <section>
        <SectionHeader
          kicker="Behind the scenes"
          title="Specialist crew"
          icon={<Users className="h-4 w-4" />}
        />
        <p className="mb-3 text-sm text-muted-foreground">
          You don't pick an agent — Maya routes your question to the right specialist automatically.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {AGENT_IDS.map((id) => (
            <CrewCard key={id} id={id} />
          ))}
        </div>
      </section>

      <section id="coach-chat" className="vp-card vp-pop-lg scroll-mt-4 bg-surface-2 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2 border-b-[3px] border-ink pb-3">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl border-[3px] border-ink bg-yellow">
              <AvatarFigure size={30} />
            </span>
            <div>
              <p className="font-bold uppercase leading-none text-ink">Coach Maya</p>
              <p className="vp-label text-muted-foreground">VIEW POINT AI</p>
            </div>
          </div>
          <GameButton
            tone="white"
            onClick={() => {
              newChat();
              setGuidance(false);
            }}
            className="min-h-10 px-3 py-2"
            disabled={!!pending}
          >
            <MessageSquarePlus className="h-4 w-4" /> New chat
          </GameButton>
        </div>

        {recents.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b-2 border-dashed border-ink py-2">
            <span className="vp-label text-muted-foreground">Recent chats</span>
            {recents.map((r) => (
              <button
                key={r.id}
                type="button"
                disabled={!!pending}
                onClick={() => {
                  void openThread(r.id);
                  setGuidance(false);
                }}
                className={cn(
                  "vp-label vp-press max-w-[12rem] truncate rounded-full border-2 border-ink px-3 py-1 text-ink",
                  r.id === conversationId ? "bg-yellow" : "bg-surface",
                )}
              >
                {r.title}
              </button>
            ))}
          </div>
        )}
        <div className="space-y-3 py-3" aria-live="polite">
          <p className="max-w-[90%] rounded-xl border-2 border-ink bg-surface p-3 text-sm text-ink">
            What would you like to understand about your wellness?
          </p>
          {messages.map((m) =>
            m.role === "user" ? (
              <p
                key={m.id}
                className="ml-auto w-fit max-w-[85%] break-words rounded-xl border-2 border-ink bg-ink px-3 py-2 text-sm text-yellow"
              >
                {m.text}
              </p>
            ) : m.kind === "reply" ? (
              <ReplyCard key={m.id} msg={m} onSend={submit} />
            ) : m.kind === "plain" ? (
              <PlainCard key={m.id} msg={m} />
            ) : m.kind === "notice" ? (
              <NoticeCard key={m.id} notice={m.notice} />
            ) : (
              <ErrorCard
                key={m.id}
                msg={m}
                onRetry={() => retry(m)}
                onGuidance={() => setGuidance(true)}
              />
            ),
          )}
          {pending && (
            <div className="vp-card w-fit bg-surface p-3" role="status">
              <p className="vp-label text-ink">
                Maya is thinking<span className="animate-pulse">…</span>
              </p>
              <p className="vp-label mt-1 flex items-center gap-1 text-muted-foreground">
                {(() => {
                  const I = agentIcons[pending.agent];
                  return <I className="h-3.5 w-3.5 animate-bounce" />;
                })()}
                Consulting {agents[pending.agent].name}…
              </p>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {(guidance || offline) && (
          <div className="mb-3 rounded-2xl border-[3px] border-dashed border-ink bg-surface p-3">
            {offline && (
              <p className="vp-label mb-2 flex items-center gap-1 text-ink">
                <WifiOff className="h-3.5 w-3.5" /> VIEW POINT AI is temporarily offline
              </p>
            )}
            {guidance ? (
              <>
                <p className="vp-label flex items-center gap-1 text-ink">
                  <Compass className="h-3.5 w-3.5" /> Quick guidance · not an AI answer — built from
                  your app data
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {quickGuidance(snapshot).map((c) => (
                    <div key={c.id} className="rounded-xl border-2 border-ink bg-surface-2 p-3">
                      <StatusChip tone={c.tone}>{c.title}</StatusChip>
                      <ul className="mt-2 space-y-1 text-sm text-ink">
                        {c.lines.map((l) => (
                          <li key={l}>• {l}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <GameButton tone="white" onClick={() => setGuidance(true)} className="w-full">
                Use quick guidance
              </GameButton>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pb-3">
          {prompts.map((p) => (
            <button
              key={p}
              type="button"
              disabled={!!pending}
              onClick={() => submit(p)}
              className="vp-label vp-press rounded-full border-2 border-ink bg-yellow px-3 py-1.5 text-left text-ink disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(text);
          }}
          className="flex items-end gap-2"
        >
          <label htmlFor="coach-input" className="sr-only">
            Message Coach Maya
          </label>
          <textarea
            id="coach-input"
            ref={inputRef}
            rows={1}
            value={text}
            maxLength={1000}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(text);
              }
            }}
            placeholder="Ask about your wellness…"
            className="min-h-12 min-w-0 flex-1 resize-none rounded-xl border-[3px] border-ink bg-surface px-3 py-3 text-sm text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-pink"
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={!!pending || !text.trim()}
            className="vp-pop vp-press grid h-12 w-12 shrink-0 place-items-center rounded-xl border-[3px] border-ink bg-pink text-surface disabled:opacity-50"
          >
            <SendHorizontal className="h-5 w-5" />
          </button>
        </form>
        <p className="vp-label mt-2 text-center text-[0.6rem] text-muted-foreground">
          Wellness education only — not diagnosis or treatment. Your chats are saved to your
          account.
        </p>
      </section>

      <SafetyNotice />
    </AppLayout>
  );
}
