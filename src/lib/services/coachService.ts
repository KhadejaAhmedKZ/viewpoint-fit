import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

/** Persists only user-visible chat content — never prompts, secrets or model reasoning. */
export const coachService = {
  async create(title: string): Promise<string> {
    const { data, error } = await supabase
      .from("coach_conversations")
      .insert({ title: title.slice(0, 120) })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return data.id;
  },
  async add(conversationId: string, role: "user" | "maya", agent: string | null, content: unknown) {
    const { error } = await supabase
      .from("coach_messages")
      .insert({ conversation_id: conversationId, role, agent, content: content as Json });
    if (error) throw new Error(error.message);
    await supabase
      .from("coach_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
  },
  async recent(limit = 5) {
    const { data, error } = await supabase
      .from("coach_conversations")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return data;
  },
  async messages(conversationId: string) {
    const { data, error } = await supabase
      .from("coach_messages")
      .select("content")
      .eq("conversation_id", conversationId)
      .order("created_at");
    if (error) throw new Error(error.message);
    return data.map((r) => r.content);
  },
};
