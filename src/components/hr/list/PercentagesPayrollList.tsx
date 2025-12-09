import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../ui/Button";
import { useProjectsWithAssignments } from "../../../hooks/useProjects";
// Assuming you might have icons installed. If not, simple SVGs are used below.
import {
  Building2,
  Users,
  RefreshCw,
  Wallet,
  CreditCard,
  Calendar,
} from "lucide-react";
import { formatDate } from "../../../utils/helpper";
import { ProjectWithAssignments } from "../../../types/extended.type";
import ProjectPercentageFormSkelton from "../../ui/loading/projectPercentageFormSkelton";
import ErrorPage from "../../ui/errorPage";
import EmptyState from "../../ui/EmptyState";

const PercentagesPayrollList = () => {
  const { projects, loading, error } = useProjectsWithAssignments();

  if (loading) return <ProjectPercentageFormSkelton />;
  if (error) return <ErrorPage error={error.message} />;

  return (
    <div className="p-4 space-y-6" dir="rtl">
      {/* Header Section */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <Building2 size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">المشاريع</h2>
            <p className="text-sm text-gray-500">إدارة نسب المشاريع والرواتب</p>
          </div>
        </div>
        <Button
          onClick={() => window.location.reload()}
          variant="primary"
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} />
          <span>تحديث</span>
        </Button>
      </div>

      {/* Grid Content */}
      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
};

// --- Sub Components ---

const ProjectCard = ({ project }: { project: ProjectWithAssignments }) => {
  const navigate = useNavigate();

  // 1. Logic Fix: Calculate Total Percentage specific to THIS project
  const projectTotalPercentage = useMemo(() => {
    return (
      project.project_percentage?.reduce<number>(
        (sum, pp) => sum + (pp?.total_percentage ?? 0),
        0
      ) ?? 0
    );
  }, [project.project_percentage]);

  // Format Employees List
  const employees = (project.project_assignments || [])
    .map((pa) =>
      pa?.employees
        ? `${pa.employees.first_name} ${pa.employees.last_name ?? ""}`.trim()
        : null
    )
    .filter((x): x is string => Boolean(x));

  return (
    <div
      onClick={() => navigate(`/hr/payroll/percentages/${project.id}`)}
      className="group flex flex-col justify-between bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Card Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex justify-between items-start mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            #{project.code}
          </span>
          {/* Visual Indicator of Total Status */}
          <span
            className={`text-sm font-bold ${projectTotalPercentage >= 100 ? "text-green-600" : "text-blue-600"}`}
          >
            {projectTotalPercentage}
          </span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
          {project.name}
        </h3>
      </div>

      {/* Card Body: Percentages Details */}
      <div className="p-5 space-y-4 flex-grow">
        {project.project_percentage && project.project_percentage.length > 0 ? (
          project.project_percentage.map((pp, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg p-3 text-sm border border-gray-100"
            >
              {/* Type Badge */}
              <div className="flex justify-between items-center mb-2">
                <span
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                    pp?.type === "bank"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {pp?.type === "bank" ? (
                    <CreditCard size={12} />
                  ) : (
                    <Wallet size={12} />
                  )}
                  {pp?.type === "bank" ? "بنك" : "كاش"}
                </span>
                <span className="font-bold text-gray-700">
                  {pp?.total_percentage ?? 0}
                </span>
              </div>

              {/* Date and Period Details */}
              <div className="space-y-1 text-gray-500 text-xs">
                <div className="flex justify-between">
                  <span>نسبة الفترة:</span>
                  <span className="text-gray-900 font-medium">
                    {pp?.period_percentage ?? 0}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-gray-200 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {pp?.period_start
                      ? formatDate(pp.period_start)
                      : "غير محدد"}
                  </span>
                  <span className="text-[10px] bg-gray-200 px-1 rounded">
                    الحالية
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-400 text-sm italic">
            لا توجد نسب مضافة
          </div>
        )}
      </div>

      {/* Card Footer: Employees */}
      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center gap-2 text-gray-600">
          <Users size={16} className="text-gray-400" />
          <span className="text-xs font-medium">المهندسين:</span>
        </div>
        <div className="mt-2 text-sm text-gray-800 line-clamp-1 h-5">
          {employees.length > 0 ? (
            employees.join("، ")
          ) : (
            <span className="text-gray-400 italic text-xs">
              لا يوجد مهندسين معينين
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PercentagesPayrollList;
