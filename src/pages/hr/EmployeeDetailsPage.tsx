import { useState } from "react";
import PersonalInfo from "../../components/hr/employee/PersonalInfo";
import { useEmployee } from "../../hooks/useEmployees";
import { useParams } from "react-router-dom";
import EmployeeDetails from "../../components/hr/employee/EmployeeDetails";
import EmployeeDocuments from "../../components/hr/employee/EmployeeDocuments";
import { useMyPermissions } from "../../hooks/permissions/useCan";
import EmployeeRole from "../../components/hr/employee/EmployeeRole";
import SalaryDetails from "../../components/hr/employee/SalaryDetails";
import EmployeeOverridesTab from "../../components/permissions/EmployeeOverridesTab";
// import SalaryDetails from "../../components/hr/employee/SalaryDetails";

export default function EmployeeDetailsPage() {
  const [activeTab, setActiveTab] = useState("personal-info");
  const { data: allowedPermissionsData } = useMyPermissions();
  const allowedPermissions = allowedPermissionsData ?? new Set<string>();
  const { id } = useParams<{ id: string }>();
  const employeeId = id || "";
  const { employee, loading, error, refetch } = useEmployee(employeeId);

  if (loading) return <div>جاري التحميل...</div>;
  if (error || !employee) return <div>خطأ في تحميل بيانات الموظف.</div>;

  const tabs = [
    {
      id: "personal-info",
      label: "المعلومات الشخصية",
      content: <PersonalInfo employee={employee} onUpdated={refetch} />,
    },
    {
      id: "employee-details",
      label: "تفاصيل الموظف",
      content: <EmployeeDetails employee={employee} onUpdated={refetch} />,
      permission: "view_employee_personal_data",
    },
    {
      id: "employee-payroll",
      label: "تفاصيل المرتبات",
      content: <SalaryDetails payroll={employee.payroll} />,
      permission: "view_employee_compensation",
    },
    {
      id: "documents",
      label: "الوثائق",
      content: (
        <EmployeeDocuments
          empId={employee.id ?? ""}
          employeeId={employee.employee_id ?? ""}
          documents={employee.employee_documents}
          onUpdated={refetch}
        />
      ),
    },
    {
      id: "employee-role",
      label: "الأدوار",
      content: <EmployeeRole employee={employee} onUpdated={refetch} />,
      permission: "manage_users",
    },
    {
      id: "employee-overrides",
      label: "الصلاحيات",
      content: (
        <EmployeeOverridesTab
          employeeId={employee.id ?? ""}
          employeeName={`${employee.first_name ?? ""} ${
            employee.last_name ?? ""
          }`.trim()}
          roleName={employee.user_role?.roles?.name ?? null}
        />
      ),
      permission: "manage_permissions_company",
    },
  ];

  // Every tab is permission-gated now — issue 19's last two holdouts
  // (this file) converted. No hardcoded role check remains anywhere in
  // this component.
  const canView = (tab: { permission?: string }) => {
    if (!tab.permission) return true; // public tab
    return allowedPermissions.has(tab.permission);
  };

  const visibleTabs = tabs.filter(canView);
  return (
    <div className="bg-background min-h-screen">
      <div>
        {/* Tabs */}
        <div className="px-6 py-4 border-b bg-white">
          <ul className="flex gap-6 text-sm text-gray-600">
            {visibleTabs.map((tab) => (
              <li key={tab.id}>
                <button
                  className={`pb-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-b-2 border-primary text-primary font-medium"
                      : "hover:text-gray-800"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {visibleTabs.find((tab) => tab.id === activeTab)?.content}
        </div>
      </div>
    </div>
  );
}
