import { Check, X } from "lucide-react";
import type { Database } from "../../../lib/supabase";
import type { Requirement } from "../../../hooks/tasks/useTaskDetail";

type RequirementType = Database["tasks"]["Enums"]["requirement_type"];

const REQUIREMENT_LABELS: Record<RequirementType, string> = {
  attachment: "مرفق مطلوب",
  report: "تقرير مطلوب",
  approval: "اعتماد مطلوب",
  checklist_complete: "إتمام قائمة التحقق",
  subtasks_complete: "إتمام المهام الفرعية",
  linked_record: "ربط بسجل",
};
const REQUIREMENT_TYPES = Object.keys(REQUIREMENT_LABELS) as RequirementType[];

interface RequirementsSectionProps {
  requirements: Requirement[];
  onToggle: (requirementId: string, satisfied: boolean) => void;
  onAdd: (requirementType: RequirementType) => void;
  onDelete: (requirementId: string) => void;
}

// "Before this can close" — requirements as a checklist, with what's
// missing visible up front (build plan D3 §5). Manually toggling one here
// is the override path (tasks.requirement.override in the permission
// list, Part 6) — no gate on that yet since Part 6 is deferred, same as
// everywhere else in this module. Adding one is the same
// "+ إضافة متطلب" pattern TemplateBuilderPage.tsx already uses for
// template_requirements — this was the only place a real (non-template)
// task had no way to get a requirement at all until now.
export default function RequirementsSection({
  requirements,
  onToggle,
  onAdd,
  onDelete,
}: RequirementsSectionProps) {
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
          <div
            key={req.id}
            className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm transition-colors ${
              req.is_satisfied
                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                : "border-amber-100 bg-amber-50 text-amber-700"
            }`}
          >
            <button onClick={() => onToggle(req.id, !req.is_satisfied)} className="flex flex-1 items-center gap-2 text-right">
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  req.is_satisfied ? "border-emerald-400 bg-emerald-400 text-white" : "border-amber-300"
                }`}
              >
                {req.is_satisfied && <Check className="h-3 w-3" />}
              </span>
              {REQUIREMENT_LABELS[req.requirement_type]}
            </button>
            <button onClick={() => onDelete(req.id)} className="shrink-0 opacity-60 hover:opacity-100">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <select
        value=""
        onChange={(e) => {
          if (e.target.value) onAdd(e.target.value as RequirementType);
        }}
        className="mt-1.5 rounded-full border border-dashed border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-400 outline-none"
      >
        <option value="">+ إضافة متطلب</option>
        {REQUIREMENT_TYPES.map((rt) => (
          <option key={rt} value={rt}>
            {REQUIREMENT_LABELS[rt]}
          </option>
        ))}
      </select>
    </div>
  );
}
