import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LoadingPage from "../../components/ui/LoadingPage";
import ErrorPage from "../../components/ui/errorPage";
import { formatCurrency } from "../../utils/helpper";
import { useBatchDetail } from "../../hooks/company/useDistributionBatch";
import EmployeesCard from "../../components/company/distribution/view/EmployeesCard";
import ProjectsCard from "../../components/company/distribution/view/ProjectsCard";

const CURRENCIES = ["LYD", "USD", "EUR"];

type Tab = "projects" | "employees";

const BatchDetailPage = () => {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const { batch, loading, error } = useBatchDetail(date!);

  const [activeTab, setActiveTab] = useState<Tab>("projects");
  const [projectSearch, setProjectSearch] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");

  if (loading) return <LoadingPage label="جاري تحميل تفاصيل الدفعة" />;
  if (error) return <ErrorPage error={error.message} label="تفاصيل الدفعة" />;
  if (!batch) return null;

  const filteredProjects = batch.projects.filter((p) =>
    `${p.projectSerial ?? ""} ${p.projectName}`
      .toLowerCase()
      .includes(projectSearch.toLowerCase()),
  );

  const filteredEmployees = batch.employees.filter((e) =>
    e.firstName.toLowerCase().includes(employeeSearch.toLowerCase()),
  );

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <h1 className="text-base font-medium text-gray-800">دفعة {date}</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {batch.projects.length} مشاريع · {batch.totalEmployeeCount} موظف
          </p>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {CURRENCIES.filter((c) => (batch.totalsByCurrency[c] ?? 0) > 0).map(
            (c) => (
              <div key={c} className="bg-gray-50 rounded-lg p-3 col-span-2">
                <p className="text-xs text-gray-400 mb-1">إجمالي {c}</p>
                <p className="text-lg font-medium tabular-nums">
                  {formatCurrency(batch.totalsByCurrency[c], c)}
                </p>
              </div>
            ),
          )}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">عدد المشاريع</p>
            <p className="text-lg font-medium">{batch.projects.length}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">عدد الموظفين</p>
            <p className="text-lg font-medium">{batch.totalEmployeeCount}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0">
          {(["projects", "employees"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-gray-800 text-gray-800 font-medium"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab === "projects" ? "المشاريع" : "الموظفين"}
            </button>
          ))}
        </div>
      </div>

      {/* Projects tab */}
      {activeTab === "projects" && (
        <div className="space-y-3">
          <div className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              🔍
            </span>
            <input
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              placeholder="بحث عن مشروع..."
              className="w-full pr-9 pl-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <ProjectsCard
            projects={filteredProjects}
            totalsByCurrency={batch.totalsByCurrency}
            date={date!}
          />
          {filteredProjects.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">
              لا توجد نتائج
            </p>
          )}
        </div>
      )}

      {/* Employees tab */}
      {activeTab === "employees" && (
        <div className="space-y-3">
          <div className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              🔍
            </span>
            <input
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              placeholder="بحث عن موظف..."
              className="w-full pr-9 pl-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <EmployeesCard
            employees={filteredEmployees}
            totalsByCurrency={batch.totalsByCurrency}
          />
          {filteredEmployees.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">
              لا توجد نتائج
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default BatchDetailPage;
