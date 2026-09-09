import { Link, useParams } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import AddTeamMemberForm from "../../../components/project/team/AddTeamMemberForm";
import TeamRoster from "../../../components/project/team/TeamRoster";
import { useProjectTeam } from "../../../hooks/team/useTeamAssignments";
import LoadingPage from "../../../components/ui/LoadingPage";
import ErrorPage from "../../../components/ui/errorPage";

// =====================================================================
// The project Team screen — implementation guide section 4.4.
// =====================================================================
// Moved here from /projects/team/:projectId. Team management now lives
// inside Execution Management: pick a project from the projects table,
// land here, manage who works on it. The Projects section no longer
// carries a team screen at all.
//
// Reads and writes team_assignments only — issue #18 retired the
// project_assignments mirror useTeamAssignments.ts used to keep in step
// (see that file).
//
// Access is unchanged by the move. manage_execution (the section) and
// manage_project_team (this route) are both granted to exactly Admin and
// Manager, with no department or individual grants on either, so nobody
// gained or lost the team screen by relocating it.
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
        to={`/execution-management/projects/${projectId}/permissions`}
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
