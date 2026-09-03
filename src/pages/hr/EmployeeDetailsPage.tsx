import { useState } from "react";
import PersonalInfo from "../../components/hr/employee/PersonalInfo";
import { useEmployee } from "../../hooks/useEmployees";
import { useParams } from "react-router-dom";
import EmployeeDetails from "../../components/hr/employee/EmployeeDetails";
import EmployeeDocuments from "../../components/hr/employee/EmployeeDocuments";
import { useAuth } from "../../hooks/useAuth";
import { useMyPermissions } from "../../hooks/permissions/useCan";
import EmployeeRole from "../../components/hr/employee/EmployeeRole";
import EmployeesPermissions from "../../components/hr/employee/EmployeesPermissions";
import SalaryDetails from "../../components/hr/employee/SalaryDetails";
// Phase 3 — new user-override tab. Added ALONGSIDE the existing
// "الصلاحيات" tab, which still reads the old permission tables and is
// deliberately left untouched until Phase 7/8.
import EmployeeOverridesTab from "../../components/permissions/EmployeeOverridesTab";
// import SalaryDetails from "../../components/hr/employee/SalaryDetails";

export default function EmployeeDetailsPage() {
  const [activeTab, setActiveTab] = useState("personal-info");
  const { user } = useAuth();
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
      // PHASE 7B: left on a role check. The nearest catalogue entries are
      // view_employee_personal_data and view_employee_salary, both granted
      // to Admin only — mapping to either would drop Manager, and mapping
      // to view_employees would add HR. Neither is a like-for-like swap.
      roles: ["Admin", "Manager"],
    },
    {
      id: "employee-payroll",
      label: "تفاصيل المرتبات",
      content: <SalaryDetails payroll={employee.payroll} />,
      // PHASE 7B: left on a role check, same reason as the tab above —
      // view_employee_salary is Admin-only and this tab is Manager-only,
      // so they are disjoint rather than equivalent.
      roles: ["Manager"],
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
      id: "employee-permissions",
      label: "الصلاحيات",
      content: <EmployeesPermissions employee={employee} />,
      permission: "manage_permissions_company",
    },
    {
      id: "employee-overrides",
      label: "استثناءات الصلاحيات (النظام الجديد)",
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

  // PHASE 7B BATCH 5. Tabs carrying `permission` are resolved; the two
  // that still carry `roles` fall back to the old string check. Both
  // paths live in one place so a tab cannot be silently ungated.
  const canView = (tab: { permission?: string; roles?: string[] }) => {
    if (tab.permission) return allowedPermissions.has(tab.permission);
    if (!tab.roles) return true; // public tab
    if (!user?.role) return false;
    return tab.roles.includes(user.role);
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
