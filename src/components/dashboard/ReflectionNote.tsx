import { useEffect, useState } from "react";
import { useGame } from "@/lib/game-state";
import { supabase } from "@/integrations/supabase/client";
import { today } from "@/lib/services/progressService";
import { GameButton } from "@/components/vp/ui";
export function ReflectionNote() {
  const { user } = useGame();
  const previous = user?.user_metadata?.["weekly_reflection"];
  const initial = typeof previous?.note === "string" ? previous.note : "";
  const [note, setNote] = useState(initial),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    setNote(initial);
    setMessage("");
  }, [user?.id, initial]);
  const save = async () => {
    if (!note.trim() || !user) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await supabase.auth.updateUser({
        data: { weekly_reflection: { date: today(), note: note.trim().slice(0, 500) } },
      });
      if (result.error) throw result.error;
      setMessage("Reflection saved to your profile.");
    } catch {
      setMessage("Could not save your reflection. Your note is still here; retry.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mt-3 space-y-2">
      <label className="block text-sm font-bold">
        One habit to carry forward
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          className="mt-2 min-h-24 w-full rounded-xl border-2 border-ink p-3"
          placeholder="What worked, and what would make it easier?"
        />
      </label>
      <GameButton tone="white" disabled={busy || !note.trim()} onClick={() => void save()}>
        {busy ? "Saving…" : "Save reflection"}
      </GameButton>
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
    </div>
  );
}
