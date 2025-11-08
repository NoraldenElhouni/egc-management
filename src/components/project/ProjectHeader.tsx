import { Link } from "react-router-dom";
import { RefreshCcw, Edit3 } from "lucide-react";
import BackButton from "../ui/BackButton";
import { statusColor } from "../../utils/colors/status";
import { Project } from "../../types/global.type";

interface ProjectHeaderProps {
  project: Project;
}

const ProjectHeader = ({ project }: ProjectHeaderProps) => {
  const refresh = () => {
    // notify parent to refresh the project (ProjectDetail can listen)
    window.dispatchEvent(
      new CustomEvent("refresh-project", { detail: { id: project.id } })
    );
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div className="flex items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{project.name}</h1>

            {project.serial_number !== null && (
              <div className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-700">
                #{String(project.serial_number)}
              </div>
            )}

            <div
              className={`text-xs px-2 py-1 rounded-md ${statusColor(project.status)}`}
            >
              {project.status}
            </div>
          </div>

          {project.description && <p className="mt-2">{project.description}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={refresh}
          title="تحديث"
          className="inline-flex items-center gap-2 bg-white border px-3 py-1 rounded-lg hover:bg-slate-50"
        >
          <RefreshCcw size={16} />
          <span className="text-sm">تحديث</span>
        </button>

        <Link
          to={`/projects/${project.id}/edit`}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700"
          title="تعديل المشروع"
        >
          <Edit3 size={16} />
          <span className="text-sm">تعديل</span>
        </Link>
        <BackButton />
      </div>
    </div>
  );
};

export default ProjectHeader;
