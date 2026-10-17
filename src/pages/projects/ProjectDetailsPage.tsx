import { useParams } from "react-router-dom";
import { ProjectStatsTab } from "../../components/project/project-stats/ProjectStatsTab";
import ProjectCountersList from "../../components/project/counters/ProjectCountersList";
import ProjectDetails from "../../components/project/ProjectDetails";
import Tabs from "../../components/ui/Tabs";
import HistoryTimeline from "../../components/logs/HistoryTimeline";
import { useCanViewLogs } from "../../hooks/logs/useActivityLog";

const ProjectDetailsPage = () => {
  const params = useParams<{ id: string }>();
  const projectId = params.id ?? "";
  const canViewLogs = useCanViewLogs();

  const tabs = [
    {
      id: "details",
      label: "تفاصيل المشروع",
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
    ...(canViewLogs
      ? [
          {
            id: "history",
            label: "السجل",
            content: (
              <div className="p-6">
                <HistoryTimeline refType="project" refId={projectId} title="سجل المشروع" />
              </div>
            ),
          },
        ]
      : []),
  ];
  return (
    <div>
      <div>
        <Tabs tabs={tabs} defaultTab="details" />
      </div>
    </div>
  );
};

export default ProjectDetailsPage;
