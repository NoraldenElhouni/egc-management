import { useState } from "react";
import { Plus, UserRound, X } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import {
  parseRoleCandidate,
  roleCandidateId,
  useAddTeamMember,
  useProjectRoles,
  useRemoveTeamMember,
  useRoleCandidateOptions,
  type TeamMember,
} from "../../../hooks/team/useTeamAssignments";
import type { ProjectRoleRow } from "../../../types/permissions.types";
import PersonSearchSelect from "../../tasks/templates/PersonSearchSelect";
import Button from "../../ui/Button";

// =====================================================================
// A project's roles as slots — Space settings → فريق المشروع.
// =====================================================================
// Every project role (public.project_roles) is one row, filled or not,
// so an empty role reads as a missing person rather than something you
// have to remember to add. Filling a slot is just picking who: an
// employee (joins the team, team_assignments) or a contractor (fills the
// role only, project_contractor_roles). The pick saves straight away —
// the role is already decided by the row.
//
// Same data as AddTeamMemberForm + TeamRoster on the execution-management
// team page; this is the role-first way into it, so template role tasks
// find someone in every role.
// =====================================================================

interface Props {
  projectId: string;
  members: TeamMember[];
  /** Chips only — no pickers, no remove (viewer without manage_project_team). */
  readOnly?: boolean;
}

export default function RoleSlotsList({ projectId, members, readOnly = false }: Props) {
  const { data: roles, isLoading } = useProjectRoles();

  if (isLoading) return <div className="text-xs text-gray-400">جارٍ تحميل الأدوار…</div>;
  if (!roles || roles.length === 0) {
    return <div className="text-sm text-gray-500">لا توجد أدوار مشاريع بعد.</div>;
  }

  return (
    <ul className="space-y-2">
      {roles.map((role) => (
        <RoleSlot
          key={role.id}
          projectId={projectId}
          role={role}
          holders={members.filter((m) => m.projectRoleId === role.id)}
          readOnly={readOnly}
        />
      ))}
    </ul>
  );
}

function RoleSlot({
  projectId,
  role,
  holders,
  readOnly,
}: {
  projectId: string;
  role: ProjectRoleRow;
  holders: TeamMember[];
  readOnly: boolean;
}) {
  const { user } = useAuth();
  const { options } = useRoleCandidateOptions();
  const addMember = useAddTeamMember();
  const removeMember = useRemoveTeamMember();
  const [adding, setAdding] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isEmpty = holders.length === 0;
  // whoever already holds this role isn't offered it again
  const held = new Set(holders.map((h) => roleCandidateId(h.personType, h.personId)));
  const available = options.filter((o) => !held.has(o.id));

  const handlePick = async (value: string | null) => {
    if (!value) return;
    setError(null);
    try {
      await addMember.mutateAsync({
        projectId,
        ...parseRoleCandidate(value),
        projectRoleId: role.id,
        assignedBy: user?.id ?? null,
      });
      setAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّرت الإضافة");
    }
  };

  const handleRemove = async (member: TeamMember) => {
    setError(null);
    try {
      await removeMember.mutateAsync({
        assignmentId: member.assignmentId,
        personType: member.personType,
        projectId,
        personId: member.personId,
        projectRoleId: member.projectRoleId,
      });
      setConfirmId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّرت الإزالة");
    }
  };

  const picker = (
    <div className="flex min-w-[220px] max-w-xs flex-1 items-center gap-2">
      <PersonSearchSelect
        options={available}
        value={null}
        onChange={handlePick}
        placeholder={addMember.isPending ? "جارٍ الحفظ…" : "اختر موظفاً أو مقاولاً…"}
      />
      {!isEmpty && (
        <button
          type="button"
          onClick={() => setAdding(false)}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          إلغاء
        </button>
      )}
    </div>
  );

  return (
    <li
      className={`rounded-xl border p-3 ${
        isEmpty ? "border-dashed border-amber-300 bg-amber-50/50" : "border-gray-200 bg-white"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-800">{role.name}</h3>
        <span className={`text-xs ${isEmpty ? "text-amber-700" : "text-gray-500"}`}>
          {isEmpty ? "لا أحد في هذا الدور" : `${holders.length} ${holders.length === 1 ? "شخص" : "أشخاص"}`}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {holders.map((member) =>
          confirmId === member.assignmentId ? (
            <span
              key={member.assignmentId}
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1"
            >
              <span className="text-xs text-gray-700">إزالة {member.fullName}؟</span>
              <Button
                variant="error"
                size="xs"
                loading={removeMember.isPending}
                onClick={() => handleRemove(member)}
              >
                نعم
              </Button>
              <Button variant="ghost" size="xs" onClick={() => setConfirmId(null)}>
                إلغاء
              </Button>
            </span>
          ) : (
            <span
              key={member.assignmentId}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1"
            >
              <UserRound size={13} className="shrink-0 text-gray-400" />
              <span className="text-xs text-gray-900">{member.fullName}</span>
              {/* same marker as the task assignee picker (AssigneeCell.tsx) */}
              {member.personType === "contractor" && (
                <span className="rounded bg-amber-100 px-1 text-[10px] font-medium text-amber-700">مقاول</span>
              )}
              {!readOnly && (
                <button
                  type="button"
                  title="إزالة من الدور"
                  onClick={() => {
                    setConfirmId(member.assignmentId);
                    setError(null);
                  }}
                  className="text-gray-300 hover:text-red-500"
                >
                  <X size={13} />
                </button>
              )}
            </span>
          ),
        )}

        {!readOnly &&
          (isEmpty || adding ? (
            picker
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            >
              <Plus size={13} />
              إضافة
            </button>
          ))}

        {readOnly && isEmpty && <span className="text-xs text-gray-400">—</span>}
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </li>
  );
}
