import { useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { Loader2, ListTodo, AlarmClock, Lock, UserX, ChevronDown, ChevronLeft } from "lucide-react";
import { useDepartmentView } from "../../hooks/tasks/useDepartmentView";
import Badge, { type BadgeVariant } from "../../components/ui/Badge";
import Tooltip from "../../components/ui/Tooltip";
import type { Priority } from "../../hooks/tasks/useTaskBoard";

// D6 — Department view (build plan Part 7). Everything here is read-only
// — an overview, not an editable board (D2 already owns editing) — so
// rows expose no inline dropdowns for status/priority/assignee. A row
// click opens the D3 slide-over as a nested route right here (task/:taskId
// under department/:departmentId, see TasksRoutes.tsx) rather than
// navigating away to the task's board, so this list stays visible behind
// it exactly like D2's own board page does.

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

const AVATAR_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];
function colorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function pillStyle(hex: string | null) {
  const color = hex ?? "#6B7280";
  return { background: `${color}1A`, color, border: `1px solid ${color}55` };
}

function MetricCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: `${tone}1A`, color: tone }}>
        {icon}
      </div>
      <div>
        <div className="text-xl font-semibold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}

export default function DepartmentPage() {
  const { departmentId } = useParams<{ departmentId: string }>();
  const navigate = useNavigate();
  const { data, loading, error } = useDepartmentView(departmentId);
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());

  const toggleProject = (id: string) => {
    setCollapsedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
        تعذّر تحميل بيانات القسم
      </div>
    );
  }

  const maxLoad = Math.max(1, ...data.teamLoad.map((r) => r.openCount));

  return (
    <div className="flex h-full flex-col overflow-y-auto" dir="rtl">
      <div className="border-b border-gray-100 px-6 py-4">
        <h1 className="text-base font-semibold text-gray-900">
          {data.department.name_ar ?? data.department.name}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-4">
        <MetricCard label="مفتوحة" value={data.metrics.open} icon={<ListTodo className="h-4.5 w-4.5" />} tone="#3B82F6" />
        <MetricCard label="متأخرة" value={data.metrics.overdue} icon={<AlarmClock className="h-4.5 w-4.5" />} tone="#EF4444" />
        <MetricCard label="محظورة" value={data.metrics.blocked} icon={<Lock className="h-4.5 w-4.5" />} tone="#6B7280" />
        <MetricCard label="غير معينة" value={data.metrics.unassigned} icon={<UserX className="h-4.5 w-4.5" />} tone="#F59E0B" />
      </div>

      <div className="flex-1 px-6 pb-6">
        <div className="mb-2 text-xs font-semibold text-gray-500">المهام حسب المشروع</div>
        {data.projectGroups.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
            لا توجد مهام لهذا القسم بعد
          </div>
        ) : (
          <div className="space-y-2">
            {data.projectGroups.map((group) => {
              const collapsed = collapsedProjects.has(group.projectId);
              const taskCount = group.zoneGroups.reduce((n, z) => n + z.tasks.length, 0);
              return (
                <div key={group.projectId} className="overflow-hidden rounded-lg border border-gray-100">
                  <button
                    onClick={() => toggleProject(group.projectId)}
                    className="flex w-full items-center gap-2 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    {collapsed ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {group.projectName}
                    <span className="text-xs font-normal text-gray-400">({taskCount})</span>
                  </button>

                  {!collapsed &&
                    group.zoneGroups.map((zoneGroup) => (
                      <div key={zoneGroup.zoneId ?? "none"}>
                        {zoneGroup.zoneName && (
                          <div className="bg-gray-50/60 px-4 py-1 text-xs text-gray-400">{zoneGroup.zoneName}</div>
                        )}
                        {zoneGroup.tasks.map((task) => {
                          const status = data.statusesById.get(task.status_id);
                          const assignees = data.assigneesByTask.get(task.id) ?? [];
                          return (
                            <button
                              key={task.id}
                              onClick={() => navigate(`/tasks/department/${departmentId}/task/${task.id}`)}
                              className="flex w-full items-center gap-2 border-t border-gray-50 px-4 py-2 text-right text-sm hover:bg-gray-50"
                            >
                              <span className="flex-1 truncate text-gray-700">{task.title}</span>
                              {task.priority && (
                                <Badge label={PRIORITY_LABELS[task.priority]} variant={PRIORITY_VARIANTS[task.priority]} size="sm" />
                              )}
                              <span
                                style={pillStyle(status?.color ?? null)}
                                className="inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap"
                              >
                                {status?.label_ar ?? "—"}
                              </span>
                              {task.is_overdue && (
                                <span className="shrink-0 text-xs font-medium text-red-500">متأخرة</span>
                              )}
                              <div className="flex shrink-0 items-center -space-x-1.5 rtl:space-x-reverse">
                                {assignees.length === 0 ? (
                                  <span className="text-xs text-gray-300">غير معين</span>
                                ) : (
                                  assignees.slice(0, 3).map((id) => {
                                    const employee = data.employeesById.get(id);
                                    const name = employee ? `${employee.first_name} ${employee.last_name ?? ""}` : "";
                                    return (
                                      <Tooltip key={id} label={name || null}>
                                        <span
                                          className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-[9px] font-semibold text-white"
                                          style={{ background: colorFor(id) }}
                                        >
                                          {initialsOf(name || "?")}
                                        </span>
                                      </Tooltip>
                                    );
                                  })
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 px-6 py-6">
        <div className="mb-2 text-xs font-semibold text-gray-500">توزيع العمل على الفريق</div>
        {data.teamLoad.length === 0 ? (
          <div className="text-sm text-gray-400">لا يوجد أعضاء في هذا القسم</div>
        ) : (
          <div className="space-y-1.5">
            {data.teamLoad.map((row) => (
              <div key={row.employeeId ?? "unassigned"} className="flex items-center gap-2 text-sm">
                <span className={`w-28 shrink-0 truncate ${row.employeeId ? "text-gray-600" : "font-medium text-amber-600"}`}>
                  {row.name}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${row.employeeId ? "bg-primary" : "bg-amber-400"}`}
                    style={{ width: `${(row.openCount / maxLoad) * 100}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-left text-xs text-gray-500">{row.openCount}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Outlet />
    </div>
  );
}
