import { formatDate } from "../../../utils/helpper";
import { ProjectAssignmentWithDetails } from "../../../types/extended.type";

interface ProjectsCardProps {
  projects?: ProjectAssignmentWithDetails[] | [];
}

const ProjectsCard = ({ projects = [] }: ProjectsCardProps) => {
  const list = (projects ?? []).filter(
    Boolean
  ) as ProjectAssignmentWithDetails[];
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border">
      <div className="flex justify-between items-start">
        <h4 className="text-md font-medium text-gray-800">المشاريع الحالية</h4>
      </div>

      <div className="mt-4 space-y-3 text-sm text-gray-700">
        {list.length > 0 ? (
          list.map((p) => (
            <div key={p.id} className="p-4 bg-gray-50 rounded-md">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{p.projects?.name ?? ""}</div>
                  <div className="text-xs text-gray-500">
                    {p.projects?.code ? `${p.projects.code} • ` : ""}
                    {p.project_roles?.name ? `${p.project_roles.name} • ` : ""}
                    {p.projects?.status ? `${p.projects.status}` : ""}
                  </div>
                </div>
                <div className="text-xs text-gray-500 text-right">
                  تعيين: {p.assigned_at ? formatDate(p.assigned_at) : "-"}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-400">لا يوجد مشاريع حالية</div>
        )}
      </div>
    </div>
  );
};

export default ProjectsCard;
