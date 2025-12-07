import { useNavigate } from "react-router-dom";
import Button from "../../ui/Button";
import { useProjectsWithAssignments } from "../../../hooks/useProjects";

const PercentagesPayrollList = () => {
  const navigate = useNavigate();
  const { projects, loading, error } = useProjectsWithAssignments();

  if (loading) return <div>جاري التحميل...</div>;
  if (error) return <div>حدث خطأ: {error.message}</div>;

  const totalPercentages = projects.reduce((total, project) => {
    const projectTotal =
      project.project_percentage?.reduce(
        (projTotal, pp) => projTotal + (pp?.total_percentage || 0),
        0
      ) ?? 0;
    return total + projectTotal;
  }, 0);

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
              pa.employees
                ? `${pa.employees.first_name} ${pa.employees.last_name ?? ""}`.trim()
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
              <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-4">
                <span className="text-sm text-gray-500">اجمالي النسبة</span>
                <span className="text-base font-semibold">
                  {totalPercentages}
                </span>
              </div>
              {project.project_percentage &&
                project.project_percentage.map((pp, index) => (
                  <div key={index} className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-500">
                        النسبة الكلية {pp?.type === "bank" ? "بنك" : "كاش"}
                      </span>
                      <span className="text-base font-semibold">
                        {pp?.total_percentage ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-500">نسبة الفترة</span>
                      <span className="text-base font-semibold">
                        {pp?.period_percentage ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">الفترة</span>
                      <span className="text-base font-semibold">
                        {pp?.period_start ?? "غير محدد"} - {"الآن"}
                      </span>
                    </div>
                  </div>
                ))}

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
