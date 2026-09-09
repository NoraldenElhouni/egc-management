import { useMemo, useState } from "react";
import { Trash2, UserRound } from "lucide-react";
import {
  TeamMember,
  useRemoveTeamMember,
} from "../../../hooks/team/useTeamAssignments";
import Button from "../../ui/Button";

// =====================================================================
// The team roster — implementation guide section 4.4 steps 1 and 7.
// =====================================================================
// Grouped by project role. Within a group everyone is rendered
// identically: same row, same order rule, no badge, no marker, no
// "primary" styling, nothing that could be read as seniority. The
// members arrive alphabetically from useProjectTeam and are rendered in
// that order without further sorting.
//
// If you are ever asked to add a "lead" star here, that is a data model
// change (guide section 2.2), not a UI change. Say so.
// =====================================================================

interface Props {
  projectId: string;
  members: TeamMember[];
}

export default function TeamRoster({ projectId, members }: Props) {
  const removeMember = useRemoveTeamMember();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const byRole = new Map<string, { roleName: string; people: TeamMember[] }>();
    for (const member of members) {
      const existing = byRole.get(member.projectRoleId);
      if (existing) existing.people.push(member);
      else
        byRole.set(member.projectRoleId, {
          roleName: member.projectRoleName,
          people: [member],
        });
    }
    return Array.from(byRole.entries())
      .map(([roleId, value]) => ({ roleId, ...value }))
      .sort((a, b) => a.roleName.localeCompare(b.roleName, "ar"));
  }, [members]);

  const handleRemove = async (member: TeamMember) => {
    setPendingId(member.assignmentId);
    setError(null);
    try {
      await removeMember.mutateAsync({
        assignmentId: member.assignmentId,
        projectId,
        personId: member.personId,
        projectRoleId: member.projectRoleId,
      });
      setConfirmId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر إزالة العضو");
    } finally {
      setPendingId(null);
    }
  };

  if (members.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
        <p className="text-sm font-medium text-gray-700">
          لا يوجد أعضاء في فريق هذا المشروع بعد
        </p>
        <p className="text-xs text-gray-500 mt-1">
          أضف أعضاء من النموذج أعلاه. عضوية الفريق لا علاقة لها بنسب التوزيع.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="border border-red-200 bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {grouped.map((group) => (
        <div
          key={group.roleId}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">
              {group.roleName}
            </h3>
            <span className="text-xs text-gray-500">
              {group.people.length}{" "}
              {group.people.length === 1 ? "شخص" : "أشخاص"}
            </span>
          </div>

          <ul className="divide-y divide-gray-100">
            {group.people.map((member) => (
              <li
                key={member.assignmentId}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <span className="flex items-center gap-3">
                  <span className="bg-gray-100 rounded-full p-2">
                    <UserRound size={15} className="text-gray-500" />
                  </span>
                  <span>
                    <span className="block text-sm text-gray-900">
                      {member.fullName}
                    </span>
                    <span className="block text-[11px] text-gray-400" dir="ltr">
                      {member.email}
                    </span>
                  </span>
                </span>

                {confirmId === member.assignmentId ? (
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">
                      إزالة من الفريق؟
                    </span>
                    <Button
                      variant="error"
                      size="xs"
                      loading={pendingId === member.assignmentId}
                      onClick={() => handleRemove(member)}
                    >
                      نعم
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setConfirmId(null)}
                    >
                      إلغاء
                    </Button>
                  </span>
                ) : (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setConfirmId(member.assignmentId);
                      setError(null);
                    }}
                  >
                    <Trash2 size={13} className="ml-1" />
                    إزالة
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <p className="text-[11px] text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
        إزالة شخص من الفريق لا تؤثر على نسبته في التوزيع، ولا العكس. الاثنان
        مستقلان تماماً ويُداران من شاشتين منفصلتين.
      </p>
    </div>
  );
}
