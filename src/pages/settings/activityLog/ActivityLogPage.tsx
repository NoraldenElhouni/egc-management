import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import ActivityFeed from "../../../components/logs/ActivityFeed";
import ActivityLogFiltersDialog, {
  EMPTY_ACTIVITY_FILTERS,
  type ActivityLogFilterState,
} from "../../../components/tables/filters/ActivityLogFiltersDialog";
import { useLogHealth } from "../../../hooks/logs/useActivityLog";
import { useMyPermissions } from "../../../hooks/permissions/useCan";
import { LOG_GROUPS, LOG_NAMES } from "../../../config/logs";
import type { ActivityFilters } from "../../../types/logs.types";
import { formatDateTime } from "../../../components/logs/logFormat";

const PARTY_LABEL: Record<string, string> = {
  vendor: "مورد",
  contractor: "مقاول",
  client: "عميل",
};

/** Projects and users for the filter dialog's searchable selects. */
function useFilterOptions() {
  return useQuery({
    queryKey: ["logs", "filter-options"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const [projects, users] = await Promise.all([
        supabase.from("projects").select("id, name, code").order("serial_number", { ascending: true }),
        supabase.from("users").select("id, first_name, last_name, party_type").order("first_name"),
      ]);
      if (projects.error) throw projects.error;
      if (users.error) throw users.error;
      return {
        projects: (projects.data ?? []).map((p) => ({
          value: p.id,
          label: p.code ? `${p.code} — ${p.name}` : p.name,
        })),
        users: (users.data ?? []).map((u) => {
          const name = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || "—";
          const party = PARTY_LABEL[u.party_type as string];
          return { value: u.id, label: party ? `${name} (${party})` : name };
        }),
      };
    },
  });
}

/** <input type="date"> value → ISO timestamp at local midnight. */
const dayStart = (value: string) => (value ? new Date(`${value}T00:00:00`).toISOString() : null);
const dayAfter = (value: string) => {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return d.toISOString();
};

const ActivityLogPage = () => {
  const { data: permissions } = useMyPermissions();
  const [filterState, setFilterState] = useState<ActivityLogFilterState>(EMPTY_ACTIVITY_FILTERS);

  const { data: options, isPending: optionsLoading } = useFilterOptions();
  const { data: health } = useLogHealth();

  // Only the groups (and their logs) this user may read.
  const groups = useMemo(
    () => LOG_GROUPS.filter((g) => permissions?.has(g.permission)),
    [permissions],
  );
  const groupOptions = useMemo(() => groups.map((g) => ({ value: g.id, label: g.label })), [groups]);
  const logOptions = useMemo(
    () =>
      LOG_NAMES.filter((l) =>
        filterState.group ? l.group === filterState.group : groups.some((g) => g.id === l.group),
      ).map((l) => ({ value: l.name, label: l.label })),
    [filterState.group, groups],
  );

  const filters: ActivityFilters = useMemo(
    () => ({
      groups: filterState.group ? [filterState.group] : null,
      logNames: filterState.logName ? [filterState.logName] : null,
      projectId: filterState.projectId || null,
      actorId: filterState.actorId || null,
      from: dayStart(filterState.fromDate),
      to: dayAfter(filterState.toDate),
    }),
    [filterState],
  );

  // Clicking a name in the table filters by that person.
  const handleActorClick = useCallback(
    (actorId: string) => setFilterState((s) => ({ ...s, actorId })),
    [],
  );

  return (
    <div className="p-4" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-800">سجل النشاط</h1>
      <p className="text-sm text-gray-500 mt-1 mb-4">
        من فعل ماذا ومتى: الدفعات والمصروفات والصلاحيات والطلبات والتوظيف. يُكتب
        السجل تلقائياً ولا يمكن تعديله.
      </p>

      {health && health.errors_7d > 0 && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            تعذّر تسجيل {health.errors_7d} عملية خلال آخر 7 أيام (العمليات نفسها
            تمّت). أبلغ المطوّر.
            {health.last_error_at && (
              <span className="block text-xs text-amber-700 mt-0.5">
                آخر خطأ: {formatDateTime(health.last_error_at)} — {health.last_log_name}
              </span>
            )}
          </div>
        </div>
      )}

      <ActivityFeed
        filters={filters}
        onActorClick={handleActorClick}
        searchAdornment={
          <ActivityLogFiltersDialog
            value={filterState}
            onChange={setFilterState}
            groupOptions={groupOptions}
            logOptions={logOptions}
            projectOptions={options?.projects ?? []}
            userOptions={options?.users ?? []}
            optionsLoading={optionsLoading}
          />
        }
      />
    </div>
  );
};

export default ActivityLogPage;
