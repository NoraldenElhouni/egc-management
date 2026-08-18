import { useParams } from "react-router-dom";
import ProjectDetails from "./ProjectDetail";
import { ProjectStatsTab } from "../../components/project/project-stats/ProjectStatsTab";
import ProjectCountersList from "../../components/project/counters/ProjectCountersList";
import Tabs from "../../components/ui/Tabs";

const ProjectDetailsPage = () => {
  const params = useParams<{ id: string }>();
  const projectId = params.id ?? "";

  const tabs = [
    {
      id: "overview",
      label: "نظرة عامة",
      content: <ProjectDetails projectId={projectId} />,
    },
    {
      id: "stats",
      label: "الإحصائيات",
      content: <ProjectStatsTab projectId={projectId} />,
    },
    {
      id: "counters",
      label: "العدادات",
      content: <ProjectCountersList projectId={projectId} />,
    },
  ];
  return (
    <div>
      <div>
        <Tabs tabs={tabs} defaultTab="overview" />
      </div>
    </div>
  );
};

export default ProjectDetailsPage;
