export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      case_attempts: {
        Row: {
          case_id: string;
          completed: boolean;
          completed_at: string;
          created_at: string;
          hint_used: boolean;
          id: string;
          is_replay: boolean;
          reward_claimed: boolean;
          score: number;
          user_id: string;
          xp_awarded: number;
        };
        Insert: {
          case_id: string;
          completed?: boolean;
          completed_at?: string;
          created_at?: string;
          hint_used?: boolean;
          id?: string;
          is_replay?: boolean;
          reward_claimed?: boolean;
          score: number;
          user_id: string;
          xp_awarded?: number;
        };
        Update: {
          case_id?: string;
          completed?: boolean;
          completed_at?: string;
          created_at?: string;
          hint_used?: boolean;
          id?: string;
          is_replay?: boolean;
          reward_claimed?: boolean;
          score?: number;
          user_id?: string;
          xp_awarded?: number;
        };
        Relationships: [];
      };
      coach_conversations: {
        Row: {
          created_at: string;
          id: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      coach_messages: {
        Row: {
          agent: string | null;
          content: Json;
          conversation_id: string;
          created_at: string;
          id: string;
          role: string;
          user_id: string;
        };
        Insert: {
          agent?: string | null;
          content: Json;
          conversation_id: string;
          created_at?: string;
          id?: string;
          role: string;
          user_id?: string;
        };
        Update: {
          agent?: string | null;
          content?: Json;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "coach_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "coach_conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      daily_wellness: {
        Row: {
          active_minutes: number | null;
          activity_load: number | null;
          break_frequency: number | null;
          created_at: string;
          data_coverage: number | null;
          date: string;
          energy_level: number | null;
          exercise_minutes: number | null;
          exercise_type: string | null;
          exercised: boolean | null;
          fuel_score: number | null;
          id: string;
          is_demo: boolean;
          meal_balance: number | null;
          meal_consistency: number | null;
          mission_score: number | null;
          mood_tags: string[];
          movement_score: number | null;
          recovery_feeling: number | null;
          recovery_score: number | null;
          sleep_minutes: number | null;
          sleep_quality: number | null;
          sleep_schedule_consistency: number | null;
          sleep_score: number | null;
          steps: number | null;
          stress_level: number | null;
          updated_at: string;
          user_id: string;
          view_score: number | null;
          water_liters: number | null;
        };
        Insert: {
          active_minutes?: number | null;
          activity_load?: number | null;
          break_frequency?: number | null;
          created_at?: string;
          data_coverage?: number | null;
          date: string;
          energy_level?: number | null;
          exercise_minutes?: number | null;
          exercise_type?: string | null;
          exercised?: boolean | null;
          fuel_score?: number | null;
          id?: string;
          is_demo?: boolean;
          meal_balance?: number | null;
          meal_consistency?: number | null;
          mission_score?: number | null;
          mood_tags?: string[];
          movement_score?: number | null;
          recovery_feeling?: number | null;
          recovery_score?: number | null;
          sleep_minutes?: number | null;
          sleep_quality?: number | null;
          sleep_schedule_consistency?: number | null;
          sleep_score?: number | null;
          steps?: number | null;
          stress_level?: number | null;
          updated_at?: string;
          user_id: string;
          view_score?: number | null;
          water_liters?: number | null;
        };
        Update: {
          active_minutes?: number | null;
          activity_load?: number | null;
          break_frequency?: number | null;
          created_at?: string;
          data_coverage?: number | null;
          date?: string;
          energy_level?: number | null;
          exercise_minutes?: number | null;
          exercise_type?: string | null;
          exercised?: boolean | null;
          fuel_score?: number | null;
          id?: string;
          is_demo?: boolean;
          meal_balance?: number | null;
          meal_consistency?: number | null;
          mission_score?: number | null;
          mood_tags?: string[];
          movement_score?: number | null;
          recovery_feeling?: number | null;
          recovery_score?: number | null;
          sleep_minutes?: number | null;
          sleep_quality?: number | null;
          sleep_schedule_consistency?: number | null;
          sleep_score?: number | null;
          steps?: number | null;
          stress_level?: number | null;
          updated_at?: string;
          user_id?: string;
          view_score?: number | null;
          water_liters?: number | null;
        };
        Relationships: [];
      };
      meal_logs: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          meal_type: string;
          description: string;
          components: string[];
          nutrition_report?: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          date: string;
          meal_type: string;
          description: string;
          components: string[];
          nutrition_report?: Json | null;
          created_at?: string;
        };
        Update: { meal_type?: string; description?: string; components?: string[] };
        Relationships: [];
      };
      mission_completions: {
        Row: {
          category: string | null;
          completed_at: string | null;
          completion_date: string;
          created_at: string;
          description: string | null;
          id: string;
          mission_id: string;
          title: string | null;
          user_id: string;
          xp_awarded: number;
        };
        Insert: {
          category?: string | null;
          completed_at?: string | null;
          completion_date: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          mission_id: string;
          title?: string | null;
          user_id: string;
          xp_awarded?: number;
        };
        Update: {
          category?: string | null;
          completed_at?: string | null;
          completion_date?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          mission_id?: string;
          title?: string | null;
          user_id?: string;
          xp_awarded?: number;
        };
        Relationships: [
          {
            foreignKeyName: "mission_completions_mission_id_fkey";
            columns: ["mission_id"];
            isOneToOne: false;
            referencedRelation: "missions";
            referencedColumns: ["id"];
          },
        ];
      };
      missions: {
        Row: {
          description: string;
          id: string;
          mission_type: string;
          title: string;
          xp_reward: number;
        };
        Insert: {
          description: string;
          id: string;
          mission_type: string;
          title: string;
          xp_reward: number;
        };
        Update: {
          description?: string;
          id?: string;
          mission_type?: string;
          title?: string;
          xp_reward?: number;
        };
        Relationships: [];
      };
      pose_sessions: {
        Row: {
          completed: boolean;
          created_at: string;
          duration_seconds: number;
          exercise: string;
          form_consistency: number;
          id: string;
          left_reps: number | null;
          reps: number;
          right_reps: number | null;
          selected_side: string | null;
          target_reps: number;
          tracking_quality: number;
          user_id: string;
        };
        Insert: {
          completed?: boolean;
          created_at?: string;
          duration_seconds: number;
          exercise: string;
          form_consistency: number;
          id?: string;
          left_reps?: number | null;
          reps: number;
          right_reps?: number | null;
          selected_side?: string | null;
          target_reps: number;
          tracking_quality: number;
          user_id: string;
        };
        Update: {
          completed?: boolean;
          created_at?: string;
          duration_seconds?: number;
          exercise?: string;
          form_consistency?: number;
          id?: string;
          left_reps?: number | null;
          reps?: number;
          right_reps?: number | null;
          selected_side?: string | null;
          target_reps?: number;
          tracking_quality?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_achievements: {
        Row: {
          achievement_id: string;
          id: string;
          kind: string;
          unlocked_at: string;
          user_id: string;
        };
        Insert: {
          achievement_id: string;
          id?: string;
          kind?: string;
          unlocked_at?: string;
          user_id: string;
        };
        Update: {
          achievement_id?: string;
          id?: string;
          kind?: string;
          unlocked_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_progress: {
        Row: {
          cases_solved: number;
          created_at: string;
          last_active_date: string | null;
          level: number;
          streak: number;
          updated_at: string;
          user_id: string;
          xp: number;
        };
        Insert: {
          cases_solved?: number;
          created_at?: string;
          last_active_date?: string | null;
          level?: number;
          streak?: number;
          updated_at?: string;
          user_id: string;
          xp?: number;
        };
        Update: {
          cases_solved?: number;
          created_at?: string;
          last_active_date?: string | null;
          level?: number;
          streak?: number;
          updated_at?: string;
          user_id?: string;
          xp?: number;
        };
        Relationships: [];
      };
      xp_transactions: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          source_id: string;
          source_type: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          id?: string;
          source_id: string;
          source_type: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: string;
          source_id?: string;
          source_type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      record_case_completion_v2: {
        Args: { p_case_id: string; p_session: Json; p_day: string };
        Returns: number;
      };
      consume_coach_request: { Args: Record<PropertyKey, never>; Returns: boolean };

      _award_xp: {
        Args: {
          p_amount: number;
          p_source: string;
          p_type: string;
          p_uid: string;
        };
        Returns: number;
      };
      _check_day: { Args: { p_day: string }; Returns: undefined };
      _touch_streak: {
        Args: { p_day: string; p_uid: string };
        Returns: undefined;
      };
      add_ai_mission: {
        Args: {
          p_category: string;
          p_day: string;
          p_description: string;
          p_title: string;
        };
        Returns: boolean;
      };
      complete_ai_mission: { Args: { p_day: string }; Returns: number };
      complete_mission: {
        Args: { p_day: string; p_mission_id: string };
        Returns: number;
      };
      level_for_xp: { Args: { p_xp: number }; Returns: number };
      record_case_completion: {
        Args: {
          p_badge: string;
          p_case_id: string;
          p_day: string;
          p_hint_used: boolean;
          p_score: number;
          p_skill: string;
          p_xp: number;
        };
        Returns: number;
      };
      record_pose_session: {
        Args: {
          p_day: string;
          p_duration: number;
          p_exercise: string;
          p_form: number;
          p_left: number;
          p_reps: number;
          p_right: number;
          p_side: string;
          p_target: number;
          p_tracking: number;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
