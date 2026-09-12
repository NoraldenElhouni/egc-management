import { Check } from "lucide-react";
import type { Requirement } from "../../../hooks/tasks/useTaskDetail";

const REQUIREMENT_LABELS: Record<Requirement["requirement_type"], string> = {
  attachment: "مرفق مطلوب",
  report: "تقرير مطلوب",
  approval: "اعتماد مطلوب",
  checklist_complete: "إتمام قائمة التحقق",
  subtasks_complete: "إتمام المهام الفرعية",
  linked_record: "ربط بسجل",
};

interface RequirementsSectionProps {
  requirements: Requirement[];
  onToggle: (requirementId: string, satisfied: boolean) => void;
}

// "Before this can close" — requirements as a checklist, with what's
// missing visible up front (build plan D3 §5). Manually toggling one here
// is the override path (tasks.requirement.override in the permission
// list, Part 6) — no gate on that yet since Part 6 is deferred, same as
// everywhere else in this module.
export default function RequirementsSection({
  requirements,
  onToggle,
}: RequirementsSectionProps) {
  if (requirements.length === 0) return null;

  const unmetCount = requirements.filter((r) => !r.is_satisfied).length;

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-gray-500">
        <span>قبل إغلاق هذه المهمة</span>
        {unmetCount > 0 && (
          <span className="rounded-full bg-amber-100 px-1.5 text-amber-700">
            {unmetCount} متبقي
          </span>
        )}
      </div>
      <div className="space-y-1">
        {requirements.map((req) => (
          <button
            key={req.id}
            onClick={() => onToggle(req.id, !req.is_satisfied)}
            className={`flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-right text-sm transition-colors ${
              req.is_satisfied
                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                : "border-amber-100 bg-amber-50 text-amber-700"
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                req.is_satisfied
                  ? "border-emerald-400 bg-emerald-400 text-white"
                  : "border-amber-300"
              }`}
            >
              {req.is_satisfied && <Check className="h-3 w-3" />}
            </span>
            {REQUIREMENT_LABELS[req.requirement_type]}
          </button>
        ))}
      </div>
    </div>
  );
}
