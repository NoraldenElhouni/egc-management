import { useState } from "react";
import PersonalInfo from "../../components/hr/employee/PersonalInfo";
import { useEmployee } from "../../hooks/useEmployees";
import { useParams } from "react-router-dom";
import EmployeeDetails from "../../components/hr/employee/EmployeeDetails";
import SalaryDetails from "../../components/hr/employee/SalaryDetails";
import EmployeeDocuments from "../../components/hr/employee/EmployeeDocuments";

export default function EmployeeDetailsPage() {
  const [activeTab, setActiveTab] = useState("personal-info");
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
    },
    {
      id: "salary-details",
      label: "تفاصيل الرواتب",
      content: <SalaryDetails payroll={employee.payroll} />,
    },
    {
      id: "documents",
      label: "الوثائق",
      content: <EmployeeDocuments documents={employee.employee_documents} />,
    },
  ];

  return (
    <div className="bg-background min-h-screen">
      <div>
        {/* Tabs */}
        <div className="px-6 py-4 border-b bg-white">
          <ul className="flex gap-6 text-sm text-gray-600">
            {tabs.map((tab) => (
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
          {tabs.find((tab) => tab.id === activeTab)?.content}
        </div>
      </div>
    </div>
  );
}
