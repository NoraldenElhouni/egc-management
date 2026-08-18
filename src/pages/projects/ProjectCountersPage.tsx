import { useParams } from "react-router-dom";
import { useProject } from "../../hooks/useProjects";
import ProjectCountersList from "../../components/project/counters/ProjectCountersList";
import LoadingPage from "../../components/ui/LoadingPage";

const ProjectCountersPage = () => {
  const params = useParams<{ id: string }>();
  const projectId = params.id ?? "";
  const { project, loading } = useProject(projectId);

  if (loading) return <LoadingPage label="جارٍ تحميل المشروع..." />;

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          عدادات الرصيد السالب
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {project?.name ?? "مشروع"}
        </p>
      </div>

      <ProjectCountersList projectId={projectId} />
    </div>
  );
};

export default ProjectCountersPage;
