import { today } from "@/lib/services/progressService";
import { useFuel } from "@/lib/fuel/fuel-state";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { coachService } from "@/lib/services/coachService";
import { useServerFn } from "@tanstack/react-start";
import { useWellness } from "@/lib/wellness/wellness-state";
import { playableCases } from "@/data/cases";
import { skills } from "@/data/skills";
import { badges } from "@/data/mock";
import { useGame } from "@/lib/game-state";
import { calculateViewScore } from "@/lib/wellnessScore";
import type { AgentId } from "./agents";
import { askCoach } from "./coach.functions";
import { buildCoachContext, type CoachSnapshot } from "./context";
import { mentionedCase, routeIntent, type Route } from "./router";
import { classifySafety, safetyNotice, type SafetyNotice } from "./safety";
import type { CoachReply } from "./schema";

export type ChatMsg =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "maya"; kind: "reply"; reply: CoachReply; route: Route; caution: boolean }
  | { id: number; role: "maya"; kind: "plain"; text: string; route: Route }
  | { id: number; role: "maya"; kind: "notice"; notice: SafetyNotice | SpoilerNotice }
  | { id: number; role: "maya"; kind: "error"; retryText: string; message: string; status: number };

export interface SpoilerNotice {
  tone: "spoiler";
  title: string;
  body: string;
  bullets: string[];
  caseId: string;
  hint: string;
}

export interface RecentChat {
  id: string;
  title: string;
  updated_at: string;
}

interface CoachState {
  messages: ChatMsg[];
  recents: RecentChat[];
  conversationId: string | null;
  push: (msg: ChatMsg) => void;
  newChat: () => void;
  openChat: (id: string) => Promise<void>;
  pending: Route | null;
  setMessages: (fn: (m: ChatMsg[]) => ChatMsg[]) => void;
  setPending: (r: Route | null) => void;
}

const g = globalThis as unknown as { __vpCoachCtx?: import("react").Context<CoachState | null> };
const Ctx = g.__vpCoachCtx ?? (g.__vpCoachCtx = createContext<CoachState | null>(null));

/** Chat memory, saved per player so conversations survive a refresh. */
export function CoachProvider({ children }: { children: ReactNode }) {
  const { user } = useGame();
  const [messages, setMessagesState] = useState<ChatMsg[]>([]);
  const [pending, setPending] = useState<Route | null>(null);
  const [recents, setRecents] = useState<RecentChat[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const convRef = useRef<Promise<string> | null>(null);
  const uid = user?.id ?? null;
  const currentUid = useRef(uid);
  currentUid.current = uid;
  const chatSequence = useRef(0);

  const openChat = useCallback(async (id: string) => {
    const sequence = ++chatSequence.current;
    const account = currentUid.current;
    const rows = await coachService.messages(id);
    if (sequence !== chatSequence.current || account !== currentUid.current) return;
    setMessagesState(rows as unknown as ChatMsg[]);
    setConversationId(id);
    convRef.current = Promise.resolve(id);
  }, []);

  useEffect(() => {
    chatSequence.current++;
    setPending(null);
    setMessagesState([]);
    setConversationId(null);
    convRef.current = null;
    setRecents([]);
    if (!uid) return;
    let live = true;
    void coachService
      .recent()
      .then(async (list) => {
        if (!live) return;
        setRecents(list);
        if (list[0]) await openChat(list[0].id);
      })
      .catch((e) => console.error(e));
    return () => {
      live = false;
    };
  }, [uid, openChat]);

  const push = useCallback(
    (msg: ChatMsg) => {
      if (currentUid.current !== uid) return;
      setMessagesState((m) => [...m, msg]);
      if (!uid || (msg.role === "maya" && msg.kind === "error")) return;
      if (!convRef.current) {
        const title = msg.role === "user" ? msg.text : "New chat";
        convRef.current = coachService.create(title).then((id) => {
          if (currentUid.current !== uid) throw new Error("Account changed");
          setConversationId(id);
          setRecents((r) =>
            [{ id, title: title.slice(0, 120), updated_at: new Date().toISOString() }, ...r].slice(
              0,
              5,
            ),
          );
          return id;
        });
      }
      const agent =
        msg.role === "maya" && (msg.kind === "reply" || msg.kind === "plain")
          ? msg.route.agent
          : null;
      void convRef.current
        .then((id) => {
          if (currentUid.current === uid) return coachService.add(id, msg.role, agent, msg);
          return undefined;
        })
        .catch((e) => {
          console.error(e);
          convRef.current = null;
        });
    },
    [uid],
  );

  const newChat = useCallback(() => {
    chatSequence.current++;
    setPending(null);
    setMessagesState([]);
    setConversationId(null);
    convRef.current = null;
  }, []);

  const value = useMemo<CoachState>(
    () => ({
      messages,
      pending,
      recents,
      conversationId,
      push,
      newChat,
      openChat,
      setMessages: setMessagesState,
      setPending,
    }),
    [messages, pending, recents, conversationId, push, newChat, openChat],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Current app values the coach may read. */
export function useCoachSnapshot(): CoachSnapshot {
  const game = useGame();
  const wellness = useWellness();
  const fuel = useFuel();
  const components = wellness.scores;
  return {
    viewScore: wellness.scores.view,
    checkIn: wellness.input,
    coverage: wellness.coverage.percent,
    meals: fuel.meals.slice(0, 3),
    components,
    level: game.levelInfo.level,
    levelTitle: game.levelInfo.title,
    xp: game.xp,
    streak: game.streak,
    missions: game.aiMission ? [...game.missions, game.aiMission] : game.missions,
    dailyQuestDone: game.dailyQuestDone,
    poseHistory: game.poseHistory,
    solvedCases: game.solvedCases.map((id) => playableCases[id]).filter((c) => c !== undefined),
    skills: skills.filter((s) => game.unlockedSkills.includes(s.id)).map((s) => s.name),
    badges: badges.filter((b) => game.earnedBadges.includes(b.id)).map((b) => b.name),
  };
}

function historyText(m: ChatMsg): string {
  if (m.role === "user") return m.text;
  if (m.kind === "reply")
    return `${m.reply.title}: ${m.reply.summary} Why: ${m.reply.why} Try: ${m.reply.actions.join("; ")}`;
  if (m.kind === "plain") return m.text;
  if (m.kind === "notice") return `${m.notice.title}: ${m.notice.body}`;
  return "";
}

export function useCoach() {
  const st = useContext(Ctx);
  if (!st) throw new Error("useCoach must be used inside CoachProvider");
  const snapshot = useCoachSnapshot();
  const ask = useServerFn(askCoach);
  const busy = useRef(false);
  const idRef = useRef(Date.now());
  const nextId = () => ++idRef.current;
  const { messages, setMessages, setPending, push } = st;

  const run = useCallback(
    async (text: string, addUser: boolean) => {
      const clean = text.trim();
      if (!clean || busy.current) return;
      busy.current = true;
      const prior = messages.filter((m) => m.role === "user" || m.kind !== "error");
      if (addUser) push({ id: nextId(), role: "user", text: clean });
      try {
        // 1) SAFETY ROUTER
        const safety = classifySafety(clean);
        const notice = safetyNotice(safety.category, clean);
        if (notice) {
          push({ id: nextId(), role: "maya", kind: "notice", notice });
          return;
        }
        // 2) INTENT ROUTER
        const lastAgent =
          [...prior]
            .reverse()
            .find(
              (m): m is Extract<ChatMsg, { kind: "reply" }> =>
                m.role === "maya" && m.kind === "reply",
            )?.route.agent ?? null;
        const route = routeIntent(clean, lastAgent as AgentId | null);
        const caseId = mentionedCase(clean);
        if (
          route.agent === "case" &&
          caseId &&
          !snapshot.solvedCases.some((c) => c.id === caseId)
        ) {
          const c = playableCases[caseId];
          push({
            id: nextId(),
            role: "maya",
            kind: "notice",
            notice: {
              tone: "spoiler",
              caseId,
              hint: c?.hint ?? "Start by opening every evidence file.",
              title: "No spoilers, detective",
              body: "Detective, I'm not giving away the case that easily 😄 Investigate the evidence first. I can give you a small hint instead.",
              bullets: [],
            },
          });
          return;
        }
        // 3) SPECIALIST via the single server endpoint
        setPending(route);
        const res = await ask({
          data: {
            message: clean,
            day: today(),
            history: prior
              .slice(-8)
              .map((m) => ({
                role: m.role === "user" ? ("user" as const) : ("maya" as const),
                text: historyText(m).slice(0, 1500),
              }))
              .filter((h) => h.text),
            agent: route.agent,
            routeReason: route.reason,
            caution: safety.level === "caution",
            context: buildCoachContext(snapshot, route.agent, route.contextAgent, caseId),
          },
        });
        if (!res.ok)
          push({
            id: nextId(),
            role: "maya",
            kind: "error",
            retryText: clean,
            message: res.message,
            status: res.status,
          });
        else if ("reply" in res)
          push({
            id: nextId(),
            role: "maya",
            kind: "reply",
            reply: { ...res.reply, agent: route.agent },
            route,
            caution: safety.level === "caution",
          });
        else push({ id: nextId(), role: "maya", kind: "plain", text: res.plain, route });
      } catch (e) {
        console.error(e);
        push({
          id: nextId(),
          role: "maya",
          kind: "error",
          retryText: clean,
          message: "Couldn't reach the coach service.",
          status: 0,
        });
      } finally {
        busy.current = false;
        setPending(null);
      }
    },
    [messages, snapshot, ask, push, setPending],
  );

  return {
    messages,
    pending: st.pending,
    snapshot,
    send: (text: string) => run(text, true),
    retry: (msg: Extract<ChatMsg, { kind: "error" }>) => {
      setMessages((m) => m.filter((x) => x.id !== msg.id));
      void run(msg.retryText, false);
    },
    addNotice: (notice: SafetyNotice | SpoilerNotice) =>
      push({ id: nextId(), role: "maya", kind: "notice", notice }),
    newChat: st.newChat,
    recents: st.recents,
    conversationId: st.conversationId,
    openChat: st.openChat,
  };
}
