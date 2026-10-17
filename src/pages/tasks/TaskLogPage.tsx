import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import ActivityTable from "../../components/logs/ActivityTable";
import TaskLogFiltersDialog, {
  EMPTY_TASK_LOG_FILTERS,
  type TaskLogFilterState,
} from "../../components/tables/filters/TaskLogFiltersDialog";
import { useLogFilterOptions, useTaskActivityLog } from "../../hooks/logs/useActivityLog";
import { dayAfterIso, dayStartIso } from "../../components/logs/logFormat";
import type { TaskLogFilters } from "../../types/logs.types";

/** Spaces with real work (not templates, not archived) for the filter. */
function useSpaceOptions() {
  return useQuery({
    queryKey: ["logs", "tasks", "space-options"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .schema("tasks")
        .from("spaces")
        .select("id, name")
        .eq("is_template", false)
        .eq("is_archived", false)
        .order("name");
      if (error) throw error;
      return (data ?? []).map((s) => ({ value: s.id, label: s.name }));
    },
  });
}

// Task log (سجل المهام): who created, edited, assigned and rescheduled
// tasks, read from the tasks module's own history by get_task_activity()
// (plans/logging-system/migrations/12_task_log.sql), which also decides
// what is worth showing. Route is gated by view_task_logs in TasksRoutes.tsx.
export default function TaskLogPage() {
  const [filterState, setFilterState] = useState<TaskLogFilterState>(EMPTY_TASK_LOG_FILTERS);

  const { data: spaces, isPending: spacesLoading } = useSpaceOptions();
  const { data: options, isPending: optionsLoading } = useLogFilterOptions();

  const filters: TaskLogFilters = useMemo(
    () => ({
      spaceId: filterState.spaceId || null,
      projectId: filterState.projectId || null,
      actorId: filterState.actorId || null,
      actions: filterState.action ? [filterState.action] : null,
      from: dayStartIso(filterState.fromDate),
      to: dayAfterIso(filterState.toDate),
    }),
    [filterState],
  );
  const query = useTaskActivityLog(filters);

  // Clicking a name in the table filters by that person.
  const handleActorClick = useCallback(
    (actorId: string) => setFilterState((s) => ({ ...s, actorId })),
    [],
  );

  return (
    <div dir="rtl" className="space-y-5 p-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">سجل المهام</h1>
        <p className="mt-1 text-sm text-gray-500">
          من أنشأ المهام وعدّلها وأسندها وغيّر مواعيدها، في كل المساحات. التعديلات
          التي تمت معاً تظهر في سطر واحد.
        </p>
      </div>

      <ActivityTable
        query={query}
        onActorClick={handleActorClick}
        emptyMessage="لا توجد أحداث مطابقة."
        searchAdornment={
          <TaskLogFiltersDialog
            value={filterState}
            onChange={setFilterState}
            spaceOptions={spaces ?? []}
            projectOptions={options?.projects ?? []}
            userOptions={options?.users ?? []}
            optionsLoading={spacesLoading || optionsLoading}
          />
        }
      />
    </div>
  );
}
