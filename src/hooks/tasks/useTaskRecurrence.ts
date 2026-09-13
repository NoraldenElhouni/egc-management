import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { Database } from "../../lib/supabase";
import { useAuth } from "../useAuth";

// Recurrence has a fully working backend already — tasks.recurrence_rules,
// tasks.generate_recurrence_occurrences() (reuses copy_task_tree, P6), and
// the tasks-scheduled-job pg_cron entry that calls it every 15 minutes on
// a 7-day lookahead (build plan §4.18/§5.6) — but nothing anywhere let a
// user create a rule. This hook is scoped to "does THIS task have a
// recurrence rule" (source_task_id = taskId), matching D3's one-task-at-
// a-time editing surface rather than a separate admin list screen.
//
// next_run_at is the one field the generator actually reads (`where
// is_active and next_run_at is not null`) — every write here keeps it in
// sync with starts_on/frequency/interval so a saved rule is never
// silently inert.

export type RecurrenceRule = Database["tasks"]["Tables"]["recurrence_rules"]["Row"];
export type RecurrenceFrequency = Database["tasks"]["Enums"]["recurrence_frequency"];
export type RecurrenceCreateMode = Database["tasks"]["Enums"]["recurrence_create_mode"];
export type MissedRunBehavior = Database["tasks"]["Enums"]["missed_run_behavior"];

export interface RecurrenceInput {
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek: number[] | null;
  dayOfMonth: number | null;
  startsOn: string;
  endsOn: string | null;
  maxOccurrences: number | null;
  createMode: RecurrenceCreateMode;
  missedRunBehavior: MissedRunBehavior;
}

export function useTaskRecurrence(taskId: string | undefined, boardId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tasksDb = supabase.schema("tasks");
  const queryKey = ["task-recurrence", taskId];

  const query = useQuery({
    queryKey,
    enabled: !!taskId,
    queryFn: async (): Promise<RecurrenceRule | null> => {
      if (!taskId) return null;
      const { data, error } = await tasksDb
        .from("recurrence_rules")
        .select("*")
        .eq("source_task_id", taskId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const createRule = useMutation({
    mutationFn: async (input: RecurrenceInput) => {
      if (!taskId || !boardId) throw new Error("task or board not loaded");
      const { error } = await tasksDb.from("recurrence_rules").insert({
        board_id: boardId,
        source_task_id: taskId,
        frequency: input.frequency,
        interval: input.interval,
        days_of_week: input.frequency === "weekly" ? input.daysOfWeek : null,
        day_of_month: input.frequency === "monthly" ? input.dayOfMonth : null,
        starts_on: input.startsOn,
        ends_on: input.endsOn,
        max_occurrences: input.maxOccurrences,
        create_mode: input.createMode,
        missed_run_behavior: input.missedRunBehavior,
        next_run_at: input.startsOn,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateRule = useMutation({
    mutationFn: async (input: RecurrenceInput) => {
      if (!query.data) throw new Error("no rule to update");
      const { error } = await tasksDb
        .from("recurrence_rules")
        .update({
          frequency: input.frequency,
          interval: input.interval,
          days_of_week: input.frequency === "weekly" ? input.daysOfWeek : null,
          day_of_month: input.frequency === "monthly" ? input.dayOfMonth : null,
          starts_on: input.startsOn,
          ends_on: input.endsOn,
          max_occurrences: input.maxOccurrences,
          create_mode: input.createMode,
          missed_run_behavior: input.missedRunBehavior,
          // Editing the schedule re-anchors the next occurrence to the new
          // start — otherwise a changed frequency/interval keeps firing
          // from a stale next_run_at computed under the old settings.
          next_run_at: input.startsOn,
        })
        .eq("id", query.data.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const toggleActive = useMutation({
    mutationFn: async (isActive: boolean) => {
      if (!query.data) throw new Error("no rule to toggle");
      const { error } = await tasksDb
        .from("recurrence_rules")
        .update({ is_active: isActive })
        .eq("id", query.data.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteRule = useMutation({
    mutationFn: async () => {
      if (!query.data) throw new Error("no rule to delete");
      const { error } = await tasksDb.from("recurrence_rules").delete().eq("id", query.data.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    rule: query.data ?? null,
    loading: query.isPending,
    createRule: createRule.mutateAsync,
    updateRule: updateRule.mutateAsync,
    toggleActive: toggleActive.mutate,
    deleteRule: deleteRule.mutateAsync,
  };
}
