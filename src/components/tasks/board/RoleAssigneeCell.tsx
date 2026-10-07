import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BriefcaseBusiness } from "lucide-react";
import { useClickOutside } from "../../../hooks/tasks/useClickOutside";
import { useAnchoredPosition } from "../../../hooks/tasks/useAnchoredPosition";
import { useProjectRoles } from "../../../hooks/team/useTeamAssignments";
import Tooltip from "../../ui/Tooltip";

// Template tasks only: assign by project role ("Project Manager") instead
// of, or alongside, named people. Sits next to AssigneeCell in template
// mode. The role becomes whoever holds it on the target project when the
// template is applied — see tasks._assign_roles.

interface RoleAssigneeCellProps {
  roleIds: string[];
  onChange: (roleIds: string[]) => void;
  align?: "left" | "right";
  /** Display only: the popover never opens (no edit rights). */
  readOnly?: boolean;
}

// First letters of the first two words ("مدير مشروع" -> "مم").
function roleInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => Array.from(w)[0])
    .join("");
}

export default function RoleAssigneeCell({ roleIds, onChange, align = "right", readOnly = false }: RoleAssigneeCellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // same placement as AssigneeCell's dropdown — never clipped on the last rows
  const popoverRef = useRef<HTMLDivElement>(null);
  useClickOutside([ref, popoverRef], () => setOpen(false));
  const pos = useAnchoredPosition(ref, popoverRef, { open, width: 224, align });
  const { data: roles = [] } = useProjectRoles();

  const nameById = new Map(roles.map((r) => [r.id, r.name]));

  const toggle = (id: string) =>
    onChange(roleIds.includes(id) ? roleIds.filter((r) => r !== id) : [...roleIds, id]);

  return (
    <div ref={ref} className="relative">
      {roleIds.length > 0 ? (
        // Same shape as AssigneeCell's avatar stack so a long role name can't
        // push the people picker out of its column; the name is in the tooltip.
        <button
          onClick={() => !readOnly && setOpen((v) => !v)}
          className="flex items-center -space-x-2 rtl:space-x-reverse"
        >
          {roleIds.slice(0, 2).map((id) => {
            const name = nameById.get(id) ?? "—";
            return (
              <Tooltip key={id} label={name}>
                <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-indigo-500 text-[10px] font-semibold text-white">
                  {roleInitials(name)}
                </span>
              </Tooltip>
            );
          })}
          {roleIds.length > 2 && (
            <Tooltip label={roleIds.slice(2).map((id) => nameById.get(id) ?? "—").join("، ")}>
              <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-indigo-100 text-[10px] font-semibold text-indigo-600">
                +{roleIds.length - 2}
              </span>
            </Tooltip>
          )}
        </button>
      ) : (
        <button
          onClick={() => !readOnly && setOpen((v) => !v)}
          className={`rounded-full p-1 text-gray-300 hover:bg-gray-100 hover:text-gray-400 ${readOnly ? "hidden" : ""}`}
          title="تكليف حسب الدور في المشروع"
        >
          <BriefcaseBusiness className="h-3.5 w-3.5" />
        </button>
      )}

      {open && createPortal(
        <div
          ref={popoverRef}
          dir="rtl"
          style={{
            position: "fixed",
            top: pos?.top ?? 0,
            left: pos?.left ?? 0,
            width: 224,
            visibility: pos ? "visible" : "hidden",
          }}
          className="z-50 rounded-lg border border-gray-200 bg-white p-2 shadow-lg"
        >
          <div className="mb-1.5 text-xs font-semibold text-gray-500">الأدوار في المشروع</div>
          {roles.map((r) => (
            <label key={r.id} className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-gray-50">
              <input type="checkbox" checked={roleIds.includes(r.id)} onChange={() => toggle(r.id)} className="h-3.5 w-3.5" />
              <span className="text-gray-700">{r.name}</span>
            </label>
          ))}
          <p className="mt-1.5 text-[11px] leading-snug text-gray-400">
            عند تطبيق القالب تُسند المهمة لمن يشغل هذا الدور في المشروع.
          </p>
        </div>,
        document.body,
      )}
    </div>
  );
}
