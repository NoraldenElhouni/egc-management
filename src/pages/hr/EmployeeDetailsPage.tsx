import { useState } from "react";
import PersonalInfo from "../../components/hr/employee/PersonalInfo";

const tabs = [
  {
    id: "personal-info",
    label: "المعلومات الشخصية",
    content: <PersonalInfo />,
  },
  {
    id: "employee-details",
    label: "تفاصيل الموظف",
    content: <div>Employee Details Content</div>,
  },
  {
    id: "salary-details",
    label: "تفاصيل الرواتب",
    content: <div>Salary Details Content</div>,
  },
  {
    id: "documents",
    label: "الوثائق",
    content: <div>Documents Content</div>,
  },
  {
    id: "salary-history",
    label: "تاريخ الرواتب",
    content: <div>Salary History Content</div>,
  },
];

export default function EmployeeDetailsPage() {
  const [activeTab, setActiveTab] = useState("personal-info");

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
