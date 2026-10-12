import { AlertTriangle, BriefcaseBusiness } from "lucide-react";
import { useCan } from "../../../hooks/permissions/useCan";
import {
  parseRoleCandidate,
  roleCandidateId,
  useRoleCandidateOptions,
  type TeamPersonType,
} from "../../../hooks/team/useTeamAssignments";
import { useAssignablePeople } from "../../../hooks/tasks/useAssignablePeople";
import type { FilledRole, RoleGap } from "../../../hooks/tasks/useRoleGaps";
import PersonSearchSelect from "./PersonSearchSelect";

// Shown by the template apply/push dialogs when a project role the
// template's tasks use has nobody in it on the target project (see
// useRoleGaps.ts). Each empty role is settled right here, without leaving
// the dialog:
//   - add someone to that role on the project (a real change — an employee
//     joins the team, a contractor fills the role; needs
//     manage_project_team on that project, and a project to add them to)
//   - assign someone directly to just these tasks
//   - leave those tasks unassigned for now
// Filled roles are only summarized; they need no decision.

export type GapChoice =
  | { kind: "role"; personId: string | null; personType?: TeamPersonType }
  | { kind: "direct"; personId: string | null }
  | { kind: "skip" };

export interface GapResolution {
  /** every gap has a complete choice */
  valid: boolean;
  /** role holders to create before copying (team_assignments or
   * project_contractor_roles, by personType) */
  addToRole: { projectId: string; roleId: string; personId: string; personType: TeamPersonType }[];
  /** {boardId: {roleId: [userIds]}} for the RPCs */
  overrides: Record<string, Record<string, string[]>>;
}

export function resolveGapChoices(gaps: RoleGap[], choices: Record<string, GapChoice>): GapResolution {
  const addToRole: GapResolution["addToRole"] = [];
  const overrides: GapResolution["overrides"] = {};
  let valid = true;

  for (const gap of gaps) {
    const choice = choices[gap.key];
    if (!choice) {
      valid = false;
      continue;
    }
    if (choice.kind === "skip") continue;
    if (!choice.personId) {
      valid = false;
      continue;
    }
    if (choice.kind === "role" && gap.projectId) {
      addToRole.push({
        projectId: gap.projectId,
        roleId: gap.roleId,
        personId: choice.personId,
        personType: choice.personType ?? "employee",
      });
    } else {
      for (const boardId of gap.boardIds) {
        overrides[boardId] ??= {};
        overrides[boardId][gap.roleId] = [choice.personId];
      }
    }
  }

  return { valid, addToRole, overrides };
}

export default function RoleGapsSection({
  gaps,
  filled,
  loading,
  choices,
  onChange,
}: {
  gaps: RoleGap[];
  filled: FilledRole[];
  loading: boolean;
  choices: Record<string, GapChoice>;
  onChange: (key: string, choice: GapChoice) => void;
}) {
  if (loading && gaps.length === 0 && filled.length === 0) {
    return <div className="text-xs text-gray-400">جارٍ التحقق من أدوار المشروع…</div>;
  }
  if (gaps.length === 0 && filled.length === 0) return null;

  return (
    <section className="space-y-2">
      {filled.length > 0 && (
        <div className="space-y-0.5 text-xs text-gray-500">
          {filled.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <BriefcaseBusiness className="h-3 w-3 text-indigo-400" />
              <span>
                {f.label} · {f.roleName} ← {f.holderNames.join("، ")}
              </span>
            </div>
          ))}
        </div>
      )}

      {gaps.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            الأدوار التالية فارغة في المشروع — اختر ماذا نفعل بمهامها
          </div>
          <div className="space-y-2">
            {gaps.map((gap) => (
              <GapRow key={gap.key} gap={gap} choice={choices[gap.key]} onChange={(c) => onChange(gap.key, c)} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function GapRow({ gap, choice, onChange }: { gap: RoleGap; choice: GapChoice | undefined; onChange: (c: GapChoice) => void }) {
  // project-scoped: without a project id this always denies, which is
  // exactly right — there's no project team to add anyone to
  const { can: canManageTeam } = useCan("manage_project_team", gap.projectId ?? undefined);
  const { options: roleOptions } = useRoleCandidateOptions();
  const people = useAssignablePeople();
  const roleDisabledReason = !gap.projectId
    ? "هذه اللوحة ليست ضمن مشروع"
    : !canManageTeam
      ? "لا تملك صلاحية تعديل فريق هذا المشروع"
      : null;

  return (
    <div className="rounded-md bg-white p-2 text-sm">
      <div className="mb-1.5 text-gray-800">
        <span className="font-medium">{gap.roleName}</span>
        <span className="text-gray-400"> · {gap.label} · {gap.taskCount} مهمة</span>
      </div>
      <div className="space-y-1.5">
        <label className={`flex items-center gap-2 ${roleDisabledReason ? "opacity-50" : ""}`} title={roleDisabledReason ?? undefined}>
          <input
            type="radio"
            name={gap.key}
            disabled={!!roleDisabledReason}
            checked={choice?.kind === "role"}
            onChange={() => onChange({ kind: "role", personId: null })}
          />
          <span className="shrink-0 text-gray-700">إضافة شخص لهذا الدور في المشروع</span>
          {choice?.kind === "role" && (
            <PersonSearchSelect
              options={roleOptions}
              value={choice.personId ? roleCandidateId(choice.personType ?? "employee", choice.personId) : null}
              onChange={(value) =>
                onChange(value ? { kind: "role", ...parseRoleCandidate(value) } : { kind: "role", personId: null })
              }
              placeholder="اختر موظفاً أو مقاولاً…"
            />
          )}
          {roleDisabledReason && <span className="text-[11px] text-gray-400">({roleDisabledReason})</span>}
        </label>

        <label className="flex items-center gap-2">
          <input
            type="radio"
            name={gap.key}
            checked={choice?.kind === "direct"}
            onChange={() => onChange({ kind: "direct", personId: null })}
          />
          <span className="shrink-0 text-gray-700">تكليف مباشر لهذه المهام فقط</span>
          {choice?.kind === "direct" && (
            <PersonSearchSelect
              options={people.map((p) => ({
                id: p.id,
                name: `${p.first_name} ${p.last_name ?? ""}`.trim(),
                tag: p.person_type === "contractor" ? "مقاول" : undefined,
              }))}
              value={choice.personId}
              onChange={(personId) => onChange({ kind: "direct", personId })}
              placeholder="اختر الشخص…"
            />
          )}
        </label>

        <label className="flex items-center gap-2">
          <input type="radio" name={gap.key} checked={choice?.kind === "skip"} onChange={() => onChange({ kind: "skip" })} />
          <span className="text-gray-700">ترك دون تكليف الآن</span>
        </label>
      </div>
    </div>
  );
}
