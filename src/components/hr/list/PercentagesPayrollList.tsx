import { useNavigate } from "react-router-dom";
import Button from "../../ui/Button";
import { useProjectsWithAssignments } from "../../../hooks/useProjects";

const PercentagesPayrollList = () => {
  const navigate = useNavigate();
  const { projects, loading, error } = useProjectsWithAssignments();

  if (loading) return <div>جاري التحميل...</div>;
  if (error) return <div>حدث خطأ: {error.message}</div>;
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">المشاريع</h2>
        <Button onClick={() => window.location.reload()}>تحديث</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => {
          const employees = (project.project_assignments || [])
            .map((pa) =>
              pa.users
                ? `${pa.users.first_name} ${pa.users.last_name ?? ""}`.trim()
                : null
            )
            .filter(Boolean) as string[];

          return (
            <div
              key={project.id}
              className="rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow cursor-pointer p-4"
              onClick={() => navigate(`/hr/payroll/percentages/${project.id}`)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">كود المشروع</span>
                <span className="font-semibold">{project.code}</span>
              </div>
              <div className="mb-2">
                <div className="text-sm text-gray-500">اسم المشروع</div>
                <div className="text-base font-medium">{project.name}</div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">النسبة المأخوذة</span>
                <span className="text-base font-semibold">
                  {project.percentage_taken ?? 0}
                </span>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">المهندسين</div>
                <div className="text-sm text-gray-800 truncate">
                  {employees.length > 0 ? employees.join("، ") : "غير مخصص"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PercentagesPayrollList;
