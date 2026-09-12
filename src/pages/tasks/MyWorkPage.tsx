import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCheck } from "lucide-react";
import { useMyWork, type MyWorkTask } from "../../hooks/tasks/useMyWork";
import Badge, { type BadgeVariant } from "../../components/ui/Badge";
import type { Priority } from "../../hooks/tasks/useTaskBoard";

// D7 — My work (build plan Part 7). See useMyWork.ts's header for why
// grouping is by source_template_task_id rather than project/board.

const PRIORITY_LABELS: Record<Priority, string> = {
  urgent: "عاجل",
  high: "مرتفعة",
  normal: "عادية",
  low: "منخفضة",
};
const PRIORITY_VARIANTS: Record<Priority, BadgeVariant> = {
  urgent: "danger",
  high: "warning",
  normal: "info",
  low: "default",
};

function pillStyle(hex: string | null) {
  const color = hex ?? "#6B7280";
  return { background: `${color}1A`, color, border: `1px solid ${color}55` };
}

function formatDate(date: string | null): string | null {
  if (!date) return null;
  // -u-nu-latn keeps Arabic month names but forces Western (1 2 3) digits
  // instead of Arabic-Indic (١ ٢ ٣), which ar-EG uses by default.
  return new Date(date).toLocaleDateString("ar-EG-u-nu-latn", { day: "numeric", month: "short" });
}

export default function MyWorkPage() {
  const navigate = useNavigate();
  const { data, loading, error, markGroupDone, markingDone } = useMyWork();
  const [pendingGroupKey, setPendingGroupKey] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-red-500">
        تعذّر تحميل أعمالي
      </div>
    );
  }

  const handleMarkDone = async (key: string, tasks: MyWorkTask[]) => {
    setPendingGroupKey(key);
    try {
      await markGroupDone(tasks);
    } finally {
      setPendingGroupKey(null);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto" dir="rtl">
      <div className="border-b border-gray-100 px-4 py-3">
        <h1 className="text-base font-semibold text-gray-900">أعمالي</h1>
      </div>

      <div className="flex-1 p-4">
        {data.groups.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
            لا توجد مهام مسندة إليك حالياً
          </div>
        ) : (
          <div className="space-y-3">
            {data.groups.map((group) => (
              <div key={group.key} className="overflow-hidden rounded-lg border border-gray-100">
                <div className="flex items-center justify-between bg-gray-50 px-3 py-2">
                  <span className="text-sm font-medium text-gray-700">
                    {group.label} <span className="text-xs font-normal text-gray-400">({group.tasks.length})</span>
                  </span>
                  <button
                    onClick={() => handleMarkDone(group.key, group.tasks)}
                    disabled={markingDone && pendingGroupKey === group.key}
                    className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >
                    {markingDone && pendingGroupKey === group.key ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCheck className="h-3 w-3" />
                    )}
                    تحديد الكل كمكتمل
                  </button>
                </div>

                {group.tasks.map((task) => {
                  const status = data.statusesById.get(task.status_id);
                  const projectName = data.projectNamesById.get(task.project_id) ?? "مشروع";
                  const zoneName = task.zone_id ? data.zoneNamesById.get(task.zone_id) : null;
                  const due = formatDate(task.due_date);
                  return (
                    <button
                      key={task.id}
                      onClick={() => navigate(`/tasks/board/${task.board_id}/task/${task.id}`)}
                      className="flex w-full items-center gap-2 border-t border-gray-50 px-3 py-2 text-right text-sm hover:bg-gray-50"
                    >
                      <span className="flex-1 truncate text-gray-700">{task.title}</span>
                      <span className="hidden shrink-0 text-xs text-gray-400 sm:inline">
                        {projectName}
                        {zoneName ? ` · ${zoneName}` : ""}
                      </span>
                      {task.priority && (
                        <Badge label={PRIORITY_LABELS[task.priority]} variant={PRIORITY_VARIANTS[task.priority]} size="sm" />
                      )}
                      <span
                        style={pillStyle(status?.color ?? null)}
                        className="inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap"
                      >
                        {status?.label_ar ?? "—"}
                      </span>
                      {due && (
                        <span className={`shrink-0 text-xs ${task.is_overdue ? "font-medium text-red-500" : "text-gray-400"}`}>
                          {due}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
