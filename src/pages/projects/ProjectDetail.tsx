import { useParams } from "react-router-dom";
import ProjectHeader from "../../components/project/ProjectHeader";
import BalanceSection from "../../components/project/BalanceSection";
import ContractorSection from "../../components/project/ContractorSection";
import TeamSection from "../../components/project/TeamSection";
import FinancialStats from "../../components/project/FinancialStats";

const ProjectDetail = () => {
  const { id: projectId } = useParams<{ id: string }>();

  if (!projectId) {
    return <div>not found</div>;
  }

  return (
    // Full-page dark wrapper — tweak to match your layout's bg
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {/* ── Header: name, client, status ── */}
        <ProjectHeader projectId={projectId} />

        {/* ── Two-column layout on wider screens ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-8">
            <BalanceSection projectId={projectId} />
            <FinancialStats projectId={projectId} />
          </div>

          {/* Right column */}
          <div className="space-y-8">
            <TeamSection projectId={projectId} />
            <ContractorSection projectId={projectId} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
