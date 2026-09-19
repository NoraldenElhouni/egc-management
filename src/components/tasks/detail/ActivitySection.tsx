import { History } from "lucide-react";
import type { Activity } from "../../../hooks/tasks/useTaskDetail";
import type { EmployeeLite } from "../../../hooks/tasks/useTaskBoard";

const ACTION_LABELS: Record<string, string> = {
  created: "أنشأ المهمة",
  status_changed: "غيّر الحالة",
  assignee_added: "أضاف مسؤولاً",
  assignee_removed: "أزال مسؤولاً",
  field_changed: "غيّر حقلاً",
  moved: "نقل المهمة",
  due_date_changed: "غيّر تاريخ الاستحقاق",
  dependency_added: "أضاف اعتماداً",
  requirement_satisfied: "استوفى متطلباً",
  link_added: "أضاف رابط سجل",
  task_assignee: "غيّر المسؤولين",
};

// System-generated activity log only — comments used to interleave here
// (build plan §4.17's original "two tables, one feed" note) but that
// buried the one thing people actually author and reread among log
// entries; comments now have their own CommentsSection near the top of
// the panel instead. Rows here are written entirely by triggers (P5),
// never editable.

export default function ActivitySection({
  activity,
  employeesById,
}: {
  activity: Activity[];
  employeesById: Map<string, EmployeeLite>;
}) {
  const nameOf = (userId: string | null) => {
    if (!userId) return "النظام";
    const e = employeesById.get(userId);
    return e ? `${e.first_name} ${e.last_name ?? ""}`.trim() : "مستخدم";
  };

  const sorted = [...activity].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (sorted.length === 0) {
    return <div className="py-4 text-center text-sm text-gray-400">لا يوجد نشاط بعد</div>;
  }

  return (
    <div className="space-y-2">
      {sorted.map((a) => (
        <div key={a.id} className="flex items-start gap-2 text-sm">
          <History className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-300" />
          <div className="flex-1">
            <span className="text-gray-700">
              {nameOf(a.changed_by)} {ACTION_LABELS[a.action] ?? a.action}
            </span>
            <div className="text-xs text-gray-400">{new Date(a.created_at).toLocaleString("ar-u-nu-latn")}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
