import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useGame } from "@/lib/game-state";
import { fuelService } from "./service";
import type { Meal } from "./model";
interface FuelState {
  meals: Meal[];
  loading: boolean;
  error: string | null;
  save: (input: unknown) => Promise<void>;
  reload: () => void;
}
const Context = createContext<FuelState | null>(null);
export function FuelProvider({ children }: { children: ReactNode }) {
  const { user } = useGame();
  const uid = user?.id;
  const current = useRef(uid);
  current.current = uid;
  const [state, setState] = useState<{ uid: string; meals: Meal[] } | null>(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState<string | null>(null),
    [version, setVersion] = useState(0);
  useEffect(() => {
    let live = true;
    setError(null);
    if (!uid) {
      setState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    void fuelService
      .list(uid)
      .then((meals) => {
        if (live) setState({ uid, meals });
      })
      .catch((e) => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [uid, version]);
  const save = async (input: unknown) => {
    if (!uid) throw new Error("Sign in to save your meal.");
    const row = await fuelService.save(uid, input);
    if (current.current !== uid) return;
    setState((prev) => ({ uid, meals: [row, ...(prev && prev.uid === uid ? prev.meals : [])] }));
    setError(null);
  };
  return (
    <Context.Provider
      value={{
        meals: state && state.uid === uid ? state.meals : [],
        loading,
        error,
        save,
        reload: () => setVersion((v) => v + 1),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useFuel() {
  const value = useContext(Context);
  if (!value) throw new Error("FuelProvider required");
  return value;
}
