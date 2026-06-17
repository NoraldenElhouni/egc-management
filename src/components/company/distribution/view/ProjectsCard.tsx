// components/distribution/ProjectsCard.tsx
import { useNavigate } from "react-router-dom";
import { BatchDetailProject } from "../../../../hooks/company/useDistributionBatch";
import { formatCurrency } from "../../../../utils/helpper";

const CURRENCIES = ["LYD", "USD", "EUR"];

interface ProjectsCardProps {
  projects: BatchDetailProject[];
  totalsByCurrency: Record<string, number>;
  date: string;
}

const ProjectsCard = ({
  projects,
  totalsByCurrency,
  date,
}: ProjectsCardProps) => {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800">المشاريع</span>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">
            {projects.length}
          </span>
        </div>
        <div className="flex gap-1.5 flex-wrap justify-end">
          {CURRENCIES.filter((c) => (totalsByCurrency[c] ?? 0) > 0).map((c) => (
            <span
              key={c}
              className="text-xs bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-md tabular-nums"
            >
              {formatCurrency(totalsByCurrency[c], c)}
            </span>
          ))}
        </div>
      </div>

      {/* Rows */}
      {projects.map((proj) => (
        <button
          key={proj.projectId}
          onClick={() =>
            navigate(
              `/company/distribute/project/${proj.projectId}?date=${date}`,
            )
          }
          className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors text-right group"
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                proj.hasReversed ? "bg-red-400" : "bg-green-500"
              }`}
            />
            <div>
              <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                {proj.projectSerial ? `#${proj.projectSerial} · ` : ""}
                {proj.projectName}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {proj.employeeCount} موظفين
                {proj.hasReversed && (
                  <span className="text-red-400 mr-1">· معكوس</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex flex-col items-end gap-0.5">
              {CURRENCIES.filter(
                (c) => (proj.totalsByCurrency[c] ?? 0) > 0,
              ).map((c) => (
                <span
                  key={c}
                  className="text-xs text-gray-500 tabular-nums bg-gray-100 px-2 py-0.5 rounded"
                >
                  {formatCurrency(proj.totalsByCurrency[c], c)}
                </span>
              ))}
            </div>
            <span className="text-gray-300 group-hover:text-blue-400 text-sm">
              ‹
            </span>
          </div>
        </button>
      ))}

      {projects.length === 0 && (
        <p className="text-center text-xs text-gray-400 py-8">لا توجد مشاريع</p>
      )}
    </div>
  );
};

export default ProjectsCard;
