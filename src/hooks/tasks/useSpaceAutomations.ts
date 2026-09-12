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
// "Conditions" (the plan's trigger → conditions → action) are not
// editable here yet — every rule created here has an empty conditions
// array, meaning "fires on every event of this trigger type" with no
// extra filtering. Trigger/action *config* isn't editable either: every
// rule is created with an empty {} config for whichever type is picked
// (e.g. a "set_status" action with no target status yet configured) —
// a real config editor per trigger/action type (a status picker for
// status_changed/set_status, a field picker for field_changed, etc.) is
// the natural next step, not built here. This screen's honest scope is
// "name a rule, pick its shape, turn it on/off, watch it run" — the
// fine-grained parameters currently need a direct DB edit.

export type Automation = Database["tasks"]["Tables"]["automations"]["Row"];
export type AutomationRun = Database["tasks"]["Tables"]["automation_runs"]["Row"];
export type TriggerType = Database["tasks"]["Enums"]["automation_trigger_type"];
export type ActionType = Database["tasks"]["Enums"]["automation_action_type"];

export function useSpaceAutomations(spaceId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const tasksDb = supabase.schema("tasks");
  const queryKey = ["space-automations", spaceId];
  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const query = useQuery({
    queryKey,
    enabled: !!spaceId,
    queryFn: async (): Promise<{ automations: Automation[]; runs: AutomationRun[] }> => {
      if (!spaceId) throw new Error("no space id");

      const { data: automations, error: automationsError } = await tasksDb
        .from("automations")
        .select("*")
        .eq("scope_type", "space")
        .eq("scope_id", spaceId)
        .order("created_at", { ascending: false });
      if (automationsError) throw automationsError;

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

      return { automations: automations ?? [], runs: runs ?? [] };
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
