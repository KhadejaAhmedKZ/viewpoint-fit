import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useGame } from "@/lib/game-state";
import { today } from "@/lib/services/progressService";
import { rowInput, wellnessService, type WellnessRow } from "@/lib/services/wellnessService";
import {
  calculateDayScores,
  calculateDataCoverage,
  type CheckInInput,
  type DayScores,
} from "./checkin";
interface WellnessState {
  input: CheckInInput | null;
  scores: DayScores;
  coverage: ReturnType<typeof calculateDataCoverage>;
  rows: WellnessRow[];
  loading: boolean;
  error: string | null;
  saving: boolean;
  day: string;
  save: (input: CheckInInput) => Promise<void>;
  reload: () => void;
}
const Context = createContext<WellnessState | null>(null);
export function WellnessProvider({ children }: { children: ReactNode }) {
  const { user, missions, aiMission, reload: reloadGame } = useGame();
  const uid = user?.id;
  const currentUid = useRef(uid);
  currentUid.current = uid;
  const [day, setDay] = useState(today);
  const [stored, setStored] = useState<{ uid: string; rows: WellnessRow[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const sequence = useRef(0);
  const reload = useCallback(() => {
    const seq = ++sequence.current;
    if (!uid) {
      setStored(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    void wellnessService
      .history(uid)
      .then((rows) => {
        if (seq === sequence.current && currentUid.current === uid) setStored({ uid, rows });
      })
      .catch(() => {
        if (seq === sequence.current && currentUid.current === uid)
          setError("Wellness history could not be loaded. Retry before editing.");
      })
      .finally(() => {
        if (seq === sequence.current) setLoading(false);
      });
  }, [uid]);
  useEffect(() => {
    reload();
    const requestSequence = sequence;
    return () => {
      requestSequence.current++;
    };
  }, [reload]);
  useEffect(() => {
    const check = () => {
      const next = today();
      if (next !== day) {
        setDay(next);
        reload();
        reloadGame();
      }
    };
    const timer = setInterval(check, 30000);
    window.addEventListener("focus", check);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", check);
    };
  }, [day, reload, reloadGame]);
  const rows = stored && stored.uid === uid ? stored.rows : [];
  const row = rows.find((r) => r.date === day);
  const input = row ? rowInput(row) : null;
  const eligible = aiMission ? [...missions, aiMission] : missions;
  const scores = calculateDayScores(input, eligible);
  const coverage = calculateDataCoverage(input, eligible.length > 0);
  const scoreSync = useRef({ uid, row, scores });
  scoreSync.current = { uid, row, scores };
  useEffect(() => {
    const state = scoreSync.current;
    if (!state.uid || !state.row || loading || saving || error) return;
    if (
      state.row.mission_score === state.scores.consistency &&
      state.row.view_score === state.scores.view
    )
      return;
    let live = true;
    const timer = setTimeout(() => {
      void wellnessService
        .syncScores(state.uid!, state.row!, state.scores.consistency, state.scores.view)
        .then((updated) => {
          if (!live || currentUid.current !== state.uid) return;
          if (!updated) {
            reload();
            return;
          }
          setStored((prev) =>
            prev && prev.uid === state.uid
              ? {
                  ...prev,
                  rows: prev.rows.map((r) =>
                    r.id === updated.id && r.updated_at === state.row!.updated_at ? updated : r,
                  ),
                }
              : prev,
          );
        })
        .catch(() => {
          if (live)
            toast.error("Score sync issue", {
              description:
                "Your answers are saved. Reopen or edit today's check-in to retry syncing the mission score.",
            });
        });
    }, 400);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [
    uid,
    row?.updated_at,
    row?.mission_score,
    row?.view_score,
    scores.consistency,
    scores.view,
    loading,
    saving,
    error,
    reload,
  ]);
  const save = async (draft: CheckInInput) => {
    if (!uid || busy.current || loading || error)
      throw new Error("Wait for your account to finish syncing, then retry.");
    if (today() !== day) {
      setDay(today());
      reload();
      throw new Error("A new day has started. Reopen the check-in to log today.");
    }
    busy.current = true;
    setSaving(true);
    ++sequence.current;
    try {
      const saved = await wellnessService.save(uid, day, draft, eligible);
      if (currentUid.current !== uid) return;
      setStored((prev) => ({
        uid,
        rows: [saved, ...(prev?.uid === uid ? prev.rows : []).filter((r) => r.date !== day)].sort(
          (a, b) => b.date.localeCompare(a.date),
        ),
      }));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };
  return (
    <Context.Provider
      value={{ input, scores, coverage, rows, day, loading, error, saving, save, reload }}
    >
      {children}
    </Context.Provider>
  );
}
export function useWellness() {
  const state = useContext(Context);
  if (!state) throw new Error("WellnessProvider required");
  return state;
}
