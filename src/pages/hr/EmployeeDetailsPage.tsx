import { useState } from "react";
import PersonalInfo from "../../components/hr/employee/PersonalInfo";
import { useEmployee } from "../../hooks/useEmployees";
import { useParams } from "react-router-dom";
import EmployeeDetails from "../../components/hr/employee/EmployeeDetails";
import EmployeeDocuments from "../../components/hr/employee/EmployeeDocuments";
import { useAuth } from "../../hooks/useAuth";
import EmployeeRole from "../../components/hr/employee/EmployeeRole";
import EmployeesPermissions from "../../components/hr/employee/EmployeesPermissions";
// import SalaryDetails from "../../components/hr/employee/SalaryDetails";

export default function EmployeeDetailsPage() {
  const [activeTab, setActiveTab] = useState("personal-info");
  const { user } = useAuth();
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
      roles: ["Admin", "Manager"], // 👈 restricted
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
      roles: ["Admin", "Manager"],
    },
    {
      id: "employee-permissions",
      label: "الصلاحيات",
      content: <EmployeesPermissions employee={employee} />,
      roles: ["Admin", "Manager"],
    },
  ];

  const canView = (allowedRoles?: string[]) => {
    if (!allowedRoles) return true; // public tab
    if (!user?.role) return false;
    return allowedRoles.includes(user.role);
  };

  const visibleTabs = tabs.filter((tab) => canView(tab.roles));
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
