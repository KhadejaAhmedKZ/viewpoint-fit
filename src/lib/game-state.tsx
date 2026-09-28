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
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Mission } from "@/types";
import type { CaseSession, HealthCase } from "@/types/cases";
import { demoMissions } from "@/data/demoMissions";

import { exercises, FORM_MASTER_BADGE, type PoseSession } from "./pose/exercises";
import { caseReducer, newSession, type CaseAction } from "./cases/caseProgress";
import { calculateMissionConsistency } from "./wellness/checkin";
import { detectLevelUp, getLevelInfo, type LevelInfo } from "./xp";

import {
  labService,
  loadProgress,
  missionService,
  poseService,
  profileService,
  today,
  type LoadedProgress,
} from "./services/progressService";

export interface XpEvent {
  id: number;
  xp: number;
  label: string;
}

export interface CaseReward {
  score: number;
  xp: number;
}

export type SyncStatus = "signed-out" | "loading" | "ready" | "error";

interface GameState {
  /** Account */
  user: User | null;
  profile: { displayName: string; createdAt: string } | null;
  status: SyncStatus;
  reload: () => void;
  rename: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Progress */
  missions: Mission[];
  xp: number;
  levelInfo: LevelInfo;
  streak: number;
  consistency: number;
  xpEvent: XpEvent | null;
  levelUp: LevelInfo | null;
  completeMission: (id: string) => void;
  dismissLevelUp: () => void;
  /** LAB */
  solvedCases: string[];
  caseRewards: Record<string, CaseReward>;
  bestScores: Record<string, number>;
  recordCaseScore: (caseId: string, score: number) => void;
  earnedBadges: string[];
  unlockedSkills: string[];
  getCaseSession: (caseId: string) => CaseSession;
  dispatchCase: (c: HealthCase, action: CaseAction) => void;
  /** Awards case XP/badge/skill once per case. Returns true only on the first claim. */
  claimCaseReward: (c: HealthCase, score: number, xp: number) => boolean;
  /** AI Coach — one rewarded AI mission per player per day. */
  aiMission: Mission | null;
  addAiMission: (m: {
    title: string;
    description: string;
    category: Mission["category"];
  }) => boolean;
  completeAiMission: () => void;
  /** Pose Coach */
  dailyQuestDone: boolean;
  poseSessions: number;
  poseHistory: PoseSession[];
  completePoseSession: (session: PoseSession, questXp: number) => { xp: boolean; badges: string[] };
}

const g = globalThis as unknown as { __vpGameCtx?: import("react").Context<GameState | null> };
const Ctx = g.__vpGameCtx ?? (g.__vpGameCtx = createContext<GameState | null>(null));

function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

function syncIssue() {
  toast.error("Sync issue", { description: "That change couldn't be saved. Please try again." });
}

/** Persistent player state. The database is the source of truth; the UI updates optimistically and rolls back on failure. */
export function GameProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<SyncStatus>("loading");
  const [data, setData] = useState<LoadedProgress | null>(null);
  const [xpEvent, setXpEvent] = useState<XpEvent | null>(null);
  const [levelUp, setLevelUp] = useState<LevelInfo | null>(null);
  const [caseSessions, setCaseSessions] = useState<Record<string, CaseSession>>({});
  const dataRef = useRef<LoadedProgress | null>(null);
  dataRef.current = data;
  const loadSeq = useRef(0);

  const load = useCallback(async (u: User) => {
    const seq = ++loadSeq.current;
    setStatus("loading");
    try {
      const d = await loadProgress(u.id);
      if (seq !== loadSeq.current) return;
      setData(d);
      setStatus("ready");
    } catch (e) {
      console.error(e);
      if (seq === loadSeq.current) setStatus("error");
    }
  }, []);

  useEffect(() => {
    let current: string | null | undefined = undefined;
    const apply = (u: User | null) => {
      if ((u?.id ?? null) === current) {
        setUser(u);
        return;
      }
      current = u?.id ?? null;
      setUser(u);
      setData(null);
      setXpEvent(null);
      setLevelUp(null);
      setCaseSessions({});
      if (u) void load(u);
      else {
        loadSeq.current++;
        setData(null);
        setStatus("signed-out");
      }
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      apply(session?.user ?? null),
    );
    void supabase.auth.getUser().then(({ data: r }) => apply(r.user));
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const patch = useCallback(
    (fn: (d: LoadedProgress) => LoadedProgress) => setData((d) => (d ? fn(d) : d)),
    [],
  );

  /** Optimistic XP; confirmed by the server's actual award. */
  const award = useCallback(
    (amount: number, label: string) => {
      const prev = dataRef.current?.xp ?? 0;
      const lu = detectLevelUp(prev, prev + amount);
      if (lu) setLevelUp(lu);
      patch((d) => ({ ...d, xp: d.xp + amount }));
      setXpEvent({ id: Date.now(), xp: amount, label });
    },
    [patch],
  );

  const reconcile = useCallback(() => {
    const seq = loadSeq.current;
    if (user)
      void loadProgress(user.id)
        .then((next) => {
          if (seq === loadSeq.current) setData(next);
        })
        .catch(() => {});
  }, [user]);

  const markActive = useCallback(() => {
    patch((d) => {
      const t = today();
      if (d.lastActive === t) return d;
      const streak = d.lastActive && daysBetween(d.lastActive, t) === 1 ? d.streak + 1 : 1;
      return { ...d, streak, lastActive: t };
    });
  }, [patch]);

  const persist = useCallback(
    async (op: () => Promise<unknown>, expectAward: number, rollback: () => void) => {
      const seq = loadSeq.current;
      try {
        const got = await op();
        if (seq !== loadSeq.current) return;
        const awarded = typeof got === "number" ? got : (got as { xp?: number })?.xp;
        if (expectAward > 0 && awarded !== expectAward) reconcile();
      } catch (e) {
        if (seq !== loadSeq.current) return;
        console.error(e);
        setXpEvent(null);
        setLevelUp(null);
        rollback();
        syncIssue();
      }
    },
    [reconcile],
  );

  const completeMission = useCallback(
    (id: string) => {
      const d = dataRef.current;
      const m = demoMissions.find((x) => x.id === id);
      if (!d || !m || d.completedToday.includes(id)) return; // never award twice
      const snapshot = d;
      patch((x) => ({ ...x, completedToday: [...x.completedToday, id] }));
      markActive();
      award(m.xp, "Mission complete");
      void persist(
        () => missionService.complete(id),
        m.xp,
        () => setData(snapshot),
      );
    },
    [award, markActive, patch, persist],
  );

  const dispatchCase = useCallback((c: HealthCase, action: CaseAction) => {
    setCaseSessions((all) => ({
      ...all,
      [c.id]: caseReducer(c, all[c.id] ?? newSession(), action),
    }));
  }, []);

  const claimCaseReward = useCallback(
    (c: HealthCase, score: number, amount: number) => {
      const d = dataRef.current;
      if (!d) return false;
      const first = !d.caseRewards[c.id];
      const snapshot = d;
      const hintUsed = caseSessions[c.id]?.hintUsed ?? false;
      patch((x) => ({
        ...x,
        bestScores: { ...x.bestScores, [c.id]: Math.max(x.bestScores[c.id] ?? -1, score) },
        ...(first
          ? {
              caseRewards: { ...x.caseRewards, [c.id]: { score, xp: amount } },
              badges: x.badges.includes(c.badgeId) ? x.badges : [...x.badges, c.badgeId],
              skills: x.skills.includes(c.skillId) ? x.skills : [...x.skills, c.skillId],
            }
          : {}),
      }));
      markActive();
      if (first) award(amount, `Case #${c.id} closed`);
      void persist(
        () =>
          labService.recordCompletion({
            caseId: c.id,
            score,
            xp: first ? amount : 0,
            badge: c.badgeId,
            skill: c.skillId,
            hintUsed,
            session: caseSessions[c.id] ?? newSession(),
          }),
        first ? amount : 0,
        () => setData(snapshot),
      );
      return first;
    },
    [award, caseSessions, markActive, patch, persist],
  );

  const addAiMission = useCallback(
    (m: { title: string; description: string; category: Mission["category"] }) => {
      const d = dataRef.current;
      if (!d || d.aiMission) return false;
      patch((x) => ({
        ...x,
        aiMission: { id: "ai-mission", ...m, xp: 40, completed: false, target: 1, progress: 0 },
      }));
      void missionService
        .addAi(m)
        .then((ok) => {
          if (!ok) reconcile();
        })
        .catch(() => {
          patch((x) => ({ ...x, aiMission: null }));
          syncIssue();
        });
      return true;
    },
    [patch, reconcile],
  );

  const completeAiMission = useCallback(() => {
    const d = dataRef.current;
    if (!d?.aiMission || d.aiMission.completed) return;
    const snapshot = d;
    patch((x) => ({
      ...x,
      aiMission: x.aiMission ? { ...x.aiMission, completed: true, progress: 1 } : null,
    }));
    markActive();
    award(40, "AI mission complete");
    void persist(
      () => missionService.completeAi(),
      40,
      () => setData(snapshot),
    );
  }, [award, markActive, patch, persist]);

  const completePoseSession = useCallback(
    (session: PoseSession, questXp: number) => {
      const d = dataRef.current;
      if (!d) return { xp: false, badges: [] };
      const snapshot = d;
      const got = new Set(d.badges);
      const fresh: string[] = [];
      const badge = exercises[session.exercise].badgeId;
      if (!got.has(badge)) {
        fresh.push(badge);
        got.add(badge);
      }
      if (Object.values(exercises).every((e) => got.has(e.badgeId)) && !got.has(FORM_MASTER_BADGE))
        fresh.push(FORM_MASTER_BADGE);
      const questXpNow = !d.questDoneToday;
      patch((x) => ({
        ...x,
        poseHistory: [session, ...x.poseHistory],
        badges: [...x.badges, ...fresh],
        questDoneToday: true,
      }));
      markActive();
      if (questXpNow) award(questXp, "Daily Quest complete");
      const seq = loadSeq.current;
      void poseService
        .record(session)
        .then((r) => {
          if (seq !== loadSeq.current) return;
          if (r.xp > 0 !== questXpNow) reconcile();
          else
            patch((x) => ({
              ...x,
              poseHistory: x.poseHistory.map((p) => (p.id === session.id ? { ...p, id: r.id } : p)),
            }));
        })
        .catch((e) => {
          if (seq !== loadSeq.current) return;
          setXpEvent(null);
          setLevelUp(null);
          console.error(e);
          setData(snapshot);
          syncIssue();
        });
      return { xp: questXpNow, badges: fresh };
    },
    [award, markActive, patch, reconcile],
  );

  const recordCaseScore = useCallback(() => {
    // Best score is saved together with the completion in claimCaseReward.
  }, []);

  const rename = useCallback(
    async (name: string) => {
      if (!user) return;
      await profileService.rename(user.id, name);
      patch((x) => ({ ...x, profile: { ...x.profile, displayName: name } }));
    },
    [patch, user],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<GameState>(() => {
    const d = data;
    const missions = demoMissions.map((m) =>
      d?.completedToday.includes(m.id)
        ? ({
            ...m,
            completed: true,
            ...(m.target !== undefined ? { progress: m.target } : {}),
          } as Mission)
        : m,
    );
    const t = today();
    const streak = d && d.lastActive && daysBetween(d.lastActive, t) <= 1 ? d.streak : 0;
    const xp = d?.xp ?? 0;
    return {
      user,
      profile: d?.profile ?? null,
      status,
      reload: () => {
        if (user) void load(user);
      },
      rename,
      signOut,
      missions,
      xp,
      levelInfo: getLevelInfo(xp),
      streak,
      consistency:
        calculateMissionConsistency(d?.aiMission ? [...missions, d.aiMission] : missions) ?? 0,
      xpEvent,
      levelUp,
      completeMission,
      dismissLevelUp: () => setLevelUp(null),
      solvedCases: Object.keys(d?.caseRewards ?? {}),
      caseRewards: d?.caseRewards ?? {},
      bestScores: d?.bestScores ?? {},
      recordCaseScore,
      earnedBadges: d?.badges ?? [],
      unlockedSkills: d?.skills ?? [],
      getCaseSession: (id) => caseSessions[id] ?? newSession(),
      dispatchCase,
      claimCaseReward,
      aiMission: d?.aiMission ?? null,
      addAiMission,
      completeAiMission,
      dailyQuestDone: d?.questDoneToday ?? false,
      poseSessions: d?.poseHistory.length ?? 0,
      poseHistory: d?.poseHistory ?? [],
      completePoseSession,
    };
  }, [
    data,
    user,
    status,
    load,
    rename,
    signOut,
    xpEvent,
    levelUp,
    completeMission,
    recordCaseScore,
    caseSessions,
    dispatchCase,
    claimCaseReward,
    addAiMission,
    completeAiMission,
    completePoseSession,
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGame() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useGame must be used inside GameProvider");
  return v;
}

/** Public sandbox: shared case engine and real camera, with no account writes. */
export function DemoGameProvider({ children }: { children: ReactNode }) {
  const base = useGame();
  const [sessions, setSessions] = useState<Record<string, CaseSession>>({});
  const value: GameState = {
    ...base,
    user: null,
    profile: null,
    status: "signed-out",
    xp: 0,
    levelInfo: getLevelInfo(0),
    streak: 0,
    xpEvent: null,
    levelUp: null,
    missions: demoMissions,
    consistency: 0,
    solvedCases: [],
    caseRewards: {},
    bestScores: {},
    earnedBadges: [],
    unlockedSkills: [],
    aiMission: null,
    dailyQuestDone: false,
    poseSessions: 0,
    poseHistory: [],
    reload: () => {},
    rename: async () => {},
    signOut: async () => {},
    completeMission: () => {},
    dismissLevelUp: () => {},
    recordCaseScore: () => {},
    claimCaseReward: () => false,
    addAiMission: () => false,
    completeAiMission: () => {},
    completePoseSession: () => ({ xp: false, badges: [] }),
    getCaseSession: (id) => sessions[id] ?? newSession(),
    dispatchCase: (c, action) =>
      setSessions((all) => ({ ...all, [c.id]: caseReducer(c, all[c.id] ?? newSession(), action) })),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
