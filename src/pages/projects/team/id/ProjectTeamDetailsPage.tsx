import { useParams } from "react-router-dom";
import TeamList from "../../../../components/project/lists/TeamList";
import AddingNewTeamProjects from "../../../../components/project/form/AddingNewTeamProjects";
import { useTeam } from "../../../../hooks/team/useTeam";
import LoadingPage from "../../../../components/ui/LoadingPage";
import ErrorPage from "../../../../components/ui/errorPage";

const ProjectTeamDetailsPage = () => {
  const { projectId } = useParams<{ projectId: string }>();

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

  const { employees, loading, error, refetch } = useTeam(projectId);

  if (loading) {
    return <LoadingPage label="تحميل الفريق..." />;
  }

  if (error) {
    return <ErrorPage error={error.message} label="خطأ في تحميل الفريق" />;
  }

  const employeesId =
    (employees
      ?.map((emp: { id: string | null }) => emp.id)
      .filter(Boolean) as string[]) || [];

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">فريق المشروع</h1>
        <p className="text-gray-600">إدارة أعضاء الفريق ونسبهم في المشروع</p>
      </div>

      <AddingNewTeamProjects
        projectId={projectId}
        employeesId={employeesId}
        onSuccess={refetch}
      />

      <TeamList employees={employees} />
    </div>
  );
};

export default ProjectTeamDetailsPage;
