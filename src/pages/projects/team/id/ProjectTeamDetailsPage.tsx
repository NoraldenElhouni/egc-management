import { Link, useParams } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import AddTeamMemberForm from "../../../../components/project/team/AddTeamMemberForm";
import TeamRoster from "../../../../components/project/team/TeamRoster";
import { useProjectTeam } from "../../../../hooks/team/useTeamAssignments";
import LoadingPage from "../../../../components/ui/LoadingPage";
import ErrorPage from "../../../../components/ui/errorPage";

// =====================================================================
// The project Team tab — implementation guide section 4.4.
// =====================================================================
// Phase 4. Reads and writes team_assignments (dual-writing to the old
// project_assignments table until Phase 8 — see useTeamAssignments.ts).
//
// The previous version of this page rendered AddingNewTeamProjects and
// TeamList, which wrote percentage and team membership into one row of
// project_assignments. Both are now unreferenced and marked deprecated;
// they are removed in Phase 8 along with the table itself.
//
// WHO CAN SEE THIS PAGE has not changed. It is gated by the same route
// and sidebar checks as before — wiring the resolver into access control
// is Phase 7, not this phase.
// =====================================================================

const ProjectTeamDetailsPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: members, isLoading, error } = useProjectTeam(projectId);

  if (!projectId) {
    return (
      <div className="p-4">
        <ErrorPage
          error="رقم المشروع غير موجود في الرابط"
          label="خطأ في المعلومات"
        />
      </div>
    );
  }

  if (isLoading) return <LoadingPage label="تحميل الفريق..." />;

  if (error) {
    return (
      <ErrorPage
        error={error instanceof Error ? error.message : "خطأ غير معروف"}
        label="خطأ في تحميل الفريق"
      />
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">فريق المشروع</h1>
        {/* The old subtitle said "إدارة أعضاء الفريق ونسبهم في المشروع"
            — members AND their percentages. Percentages are not managed
            here any more, and the heading should not suggest they are. */}
        <p className="text-gray-600">
          من يعمل على هذا المشروع، وبأي دور. نسب التوزيع تُدار من شاشة مستقلة.
        </p>
      </div>

      {/* Phase 6 — the way in to the project permissions page. Kept as a
          link rather than a tab because team membership and permissions
          are separate facts; being on the team grants nothing by itself. */}
      <Link
        to={`/projects/team/${projectId}/permissions`}
        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        <ShieldCheck size={15} />
        صلاحيات هذا المشروع ←
      </Link>

      <AddTeamMemberForm projectId={projectId} members={members ?? []} />

      <TeamRoster projectId={projectId} members={members ?? []} />
    </div>
  );
};

export default ProjectTeamDetailsPage;
