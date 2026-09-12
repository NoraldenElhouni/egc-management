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
};

// Activity only — no tasks.task_comments table exists yet (see
// useTaskDetail.ts header note), so this is the system log, not a
// comment thread. Written entirely by triggers (build plan P5/§5.3),
// never by the app, so there's nothing here to author or edit.
export default function ActivitySection({
  activity,
  employeesById,
}: {
  activity: Activity[];
  employeesById: Map<string, EmployeeLite>;
}) {
  return (
    <div className="space-y-2">
      <div className="rounded-md bg-gray-50 px-2.5 py-1.5 text-xs text-gray-400">
        التعليقات غير متاحة بعد في هذا الإصدار — هذا سجل النشاط فقط.
      </div>

      {activity.length === 0 ? (
        <div className="py-4 text-center text-sm text-gray-400">لا يوجد نشاط</div>
      ) : (
        <div className="space-y-2">
          {activity.map((a) => {
            const actor = a.changed_by ? employeesById.get(a.changed_by) : null;
            return (
              <div key={a.id} className="flex items-start gap-2 text-sm">
                <History className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-300" />
                <div className="flex-1">
                  <span className="text-gray-700">
                    {actor ? `${actor.first_name} ${actor.last_name ?? ""}` : "النظام"}{" "}
                    {ACTION_LABELS[a.action] ?? a.action}
                  </span>
                  <div className="text-xs text-gray-400">
                    {new Date(a.created_at).toLocaleString("ar")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
