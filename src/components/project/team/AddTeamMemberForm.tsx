import { useMemo, useState } from "react";
import { UserPlus } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import {
  TeamMember,
  TeamPersonType,
  useAddTeamMember,
  useAssignableContractorsForRoles,
  useAssignableStaffForTeam,
  useProjectRoles,
} from "../../../hooks/team/useTeamAssignments";
import { SearchableSelectField } from "../../ui/inputs/SearchableSelectField";
import Button from "../../ui/Button";

// =====================================================================
// Add a team member — implementation guide section 4.4 steps 2 to 6.
// =====================================================================
// Two fields. Person and project role. That is the whole form.
//
// The person can be an employee (a team member, team_assignments) or a
// contractor filling the role (project_contractor_roles) — same roles,
// so template role tasks reach either. A contractor is not a team member
// and gets no project permissions from this.
//
// NO PERCENTAGE FIELD, and no link to the distribution screen. The guide
// is explicit (section 4.5): "Do not put '…and set their percentage' at
// the end of the add-to-team flow." They are two facts about two
// different things and the product has to make that obvious, not just
// the schema.
//
// NO CARDINALITY LIMIT. Adding a third, fourth or fifth Project Manager
// is a normal thing to do. There is no confirmation dialog, no warning,
// no disabled option and no styling that marks it as unusual — at most
// the neutral count note below, which offers nothing to "fix" because
// there is nothing wrong.
// =====================================================================

interface Props {
  projectId: string;
  /** Current roster, used only to disable exact duplicates. */
  members: TeamMember[];
  onAdded?: () => void;
}

export default function AddTeamMemberForm({
  projectId,
  members,
  onAdded,
}: Props) {
  const { user } = useAuth();
  const [personType, setPersonType] = useState<TeamPersonType>("employee");
  const { data: staff, isLoading: staffLoading } = useAssignableStaffForTeam();
  const { data: contractors, isLoading: contractorsLoading } =
    useAssignableContractorsForRoles();
  const { data: roles, isLoading: rolesLoading } = useProjectRoles();
  const addMember = useAddTeamMember();

  const [personId, setPersonId] = useState("");
  const [projectRoleId, setProjectRoleId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // The exact combinations already held. This is the ONLY thing that
  // disables anything in this form.
  const heldCombinations = useMemo(
    () =>
      new Set(
        members.map((m) => `${m.personType}:${m.personId}:${m.projectRoleId}`),
      ),
    [members],
  );

  // Everyone stays in the picker, including people already on the team.
  // Somebody who is the Site Engineer can legitimately also be the
  // Architectural Engineer on a small job, so filtering them out
  // entirely — which the old form did — was wrong.
  const personOptions = useMemo(
    () =>
      ((personType === "contractor" ? contractors : staff) ?? []).map(
        (person) => ({
          label: person.fullName,
          value: person.id,
        }),
      ),
    [personType, staff, contractors],
  );
  const peopleLoading =
    personType === "contractor" ? contractorsLoading : staffLoading;

  const duplicateSelected =
    personId !== "" &&
    projectRoleId !== "" &&
    heldCombinations.has(`${personType}:${personId}:${projectRoleId}`);

  // Purely informational. Rendered as a plain sentence, never as a
  // warning, and with no way to act on it.
  const countAfterAdd = useMemo(() => {
    if (!projectRoleId) return null;
    const roleName = roles?.find((r) => r.id === projectRoleId)?.name;
    if (!roleName) return null;
    const current = members.filter(
      (m) => m.projectRoleId === projectRoleId,
    ).length;
    if (duplicateSelected) return null;
    return { roleName, total: current + 1 };
  }, [projectRoleId, roles, members, duplicateSelected]);

  const canSubmit =
    personId !== "" &&
    projectRoleId !== "" &&
    !duplicateSelected &&
    !addMember.isPending;

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    try {
      await addMember.mutateAsync({
        projectId,
        personId,
        personType,
        projectRoleId,
        assignedBy: user?.id ?? null,
      });
      setSuccess(
        personType === "contractor"
          ? "تمت إضافة المقاول إلى الدور."
          : "تمت إضافة العضو إلى الفريق.",
      );
      setPersonId("");
      setProjectRoleId("");
      onAdded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّرت إضافة العضو");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
      <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
        <UserPlus size={16} className="text-gray-400" />
        إضافة عضو إلى الفريق
      </h3>

      {success && (
        <div className="rounded-md text-sm bg-green-50 text-green-700 border border-green-200 px-3 py-2">
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-md text-sm bg-red-50 text-red-700 border border-red-200 px-3 py-2">
          {error}
        </div>
      )}

      <div className="inline-flex rounded-md border border-gray-200 p-0.5 text-sm">
        {(
          [
            ["employee", "موظف"],
            ["contractor", "مقاول"],
          ] as const
        ).map(([type, label]) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              setPersonType(type);
              setPersonId("");
            }}
            disabled={addMember.isPending}
            className={`rounded px-3 py-1 ${
              personType === type
                ? "bg-gray-100 font-medium text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SearchableSelectField
          id="team-person"
          label={personType === "contractor" ? "المقاول" : "الشخص"}
          value={personId}
          onChange={setPersonId}
          options={personOptions}
          placeholder={
            personType === "contractor"
              ? "-- ابحث عن مقاول --"
              : "-- ابحث عن موظف --"
          }
          disabled={peopleLoading || addMember.isPending}
        />

        {/* A plain select rather than the shared SelectField: that
            component is react-hook-form only (it takes a `register`
            prop and has no controlled value/onChange), and this form
            does not use react-hook-form. */}
        <div className="flex flex-col">
          <label
            htmlFor="team-project-role"
            className="mb-1 text-sm text-foreground"
          >
            الدور في المشروع
          </label>
          <select
            id="team-project-role"
            value={projectRoleId}
            onChange={(e) => setProjectRoleId(e.target.value)}
            disabled={rolesLoading || addMember.isPending}
            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          >
            <option value="">-- اختر الدور --</option>
            {/* Every project role is always selectable. Nothing is
                disabled or hidden because somebody already holds it. */}
            {(roles ?? []).map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="button"
          className="self-end"
          disabled={!canSubmit}
          loading={addMember.isPending}
          onClick={handleSubmit}
        >
          {personType === "contractor" ? "إضافة إلى الدور" : "إضافة إلى الفريق"}
        </Button>
      </div>

      {personType === "contractor" && (
        <p className="text-xs text-gray-500">
          يظهر هنا المقاولون المرتبطون بحساب مستخدم فقط. المقاول يستلم مهام هذا
          الدور من القوالب، لكنه لا يصبح عضواً في فريق المشروع ولا يحصل على
          صلاحياته.
        </p>
      )}

      {duplicateSelected && (
        <p className="text-xs text-amber-700">
          هذا الشخص يشغل هذا الدور بالفعل في هذا المشروع. اختر دوراً مختلفاً —
          يمكن لنفس الشخص أن يشغل أكثر من دور في المشروع الواحد.
        </p>
      )}

      {countAfterAdd && (
        <p className="text-xs text-gray-500">
          سيصبح لدى هذا المشروع {countAfterAdd.total} من «
          {countAfterAdd.roleName}». لا يوجد حد أقصى.
        </p>
      )}
    </div>
  );
}
