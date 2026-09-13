import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import type { Database, Json } from "../../lib/supabase";
import { useAuth } from "../useAuth";

// =====================================================================
// D10 — Automations (build plan Part 7, §5.5).
// =====================================================================
// Scoped to a single space here (scope_type='space') — automations can
// also scope to a folder or board, but exposing all three scope pickers
// multiplies this screen for a case this app doesn't have folders/boards
// navigated to it from yet. Space-scoped covers the common case; a
// folder/board scope picker is a reasonable follow-up, not built now.
//
// Trigger/action config is now editable per-type (status_changed and
// set_status get a real status picker, set_assignee an employee picker,
// move_task a board picker, etc.) — the values below are genuinely saved
// to trigger_config/action_config, not just labels.
//
// IMPORTANT — no execution engine exists yet. There is no generic
// trigger anywhere in the DB that reads tasks.automations and actually
// fires it; only three hard-coded "recipe" functions exist
// (automation_all_subtasks_complete, automation_close_tasks_on_linked_record,
// run_due_date_automations — build plan §5.5), none of which consult
// user-created rows in this table. So a rule created and turned on here
// is stored correctly and will run the moment an engine reads it, but
// nothing fires it today. That's a deliberately separate, much bigger
// and riskier piece of work (a live trigger touching every task write)
// than this CRUD screen, and hasn't been built — flagged, not hidden.

export type Automation = Database["tasks"]["Tables"]["automations"]["Row"];
export type AutomationRun = Database["tasks"]["Tables"]["automation_runs"]["Row"];
export type TriggerType = Database["tasks"]["Enums"]["automation_trigger_type"];
export type ActionType = Database["tasks"]["Enums"]["automation_action_type"];

export interface AutomationPickerData {
  employees: { id: string; name: string }[];
  boards: { id: string; name: string }[];
  fields: { id: string; name_ar: string }[];
  templates: { id: string; name_ar: string }[];
}

export function useSpaceAutomations(spaceId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const tasksDb = supabase.schema("tasks");
  const queryKey = ["space-automations", spaceId];
  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const query = useQuery({
    queryKey,
    enabled: !!spaceId,
    queryFn: async (): Promise<{ automations: Automation[]; runs: AutomationRun[]; pickers: AutomationPickerData }> => {
      if (!spaceId) throw new Error("no space id");

      const [
        { data: automations, error: automationsError },
        { data: employees, error: employeesError },
        { data: boards, error: boardsError },
        { data: fields, error: fieldsError },
        { data: templates, error: templatesError },
      ] = await Promise.all([
        tasksDb.from("automations").select("*").eq("scope_type", "space").eq("scope_id", spaceId).order("created_at", { ascending: false }),
        supabase.from("employees").select("id, first_name, last_name"),
        tasksDb.from("boards").select("id, name").eq("space_id", spaceId).eq("is_archived", false),
        tasksDb.from("field_definitions").select("id, name_ar"),
        tasksDb.from("templates").select("id, name_ar"),
      ]);
      if (automationsError) throw automationsError;
      if (employeesError) throw employeesError;
      if (boardsError) throw boardsError;
      if (fieldsError) throw fieldsError;
      if (templatesError) throw templatesError;

      const automationIds = (automations ?? []).map((a) => a.id);
      const { data: runs, error: runsError } = automationIds.length
        ? await tasksDb
            .from("automation_runs")
            .select("*")
            .in("automation_id", automationIds)
            .order("ran_at", { ascending: false })
            .limit(30)
        : { data: [], error: null };
      if (runsError) throw runsError;

      return {
        automations: automations ?? [],
        runs: runs ?? [],
        pickers: {
          employees: (employees ?? []).map((e) => ({ id: e.id, name: `${e.first_name} ${e.last_name ?? ""}`.trim() })),
          boards: boards ?? [],
          fields: fields ?? [],
          templates: templates ?? [],
        },
      };
    },
  });

  const create = useMutation({
    mutationFn: async (input: {
      name: string;
      triggerType: TriggerType;
      triggerConfig: Json;
      actionType: ActionType;
      actionConfig: Json;
    }) => {
      if (!spaceId) throw new Error("no space id");
      const { error } = await tasksDb.from("automations").insert({
        scope_type: "space",
        scope_id: spaceId,
        name: input.name,
        trigger_type: input.triggerType,
        trigger_config: input.triggerConfig,
        conditions: [],
        action_type: input.actionType,
        action_config: input.actionConfig,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await tasksDb.from("automations").update({ is_active: isActive }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await tasksDb.from("automations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    data: query.data,
    loading: query.isPending,
    error: query.error,
    createAutomation: create.mutateAsync,
    toggleActive: toggleActive.mutateAsync,
    deleteAutomation: remove.mutateAsync,
  };
}
