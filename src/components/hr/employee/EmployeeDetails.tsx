import { FullEmployee } from "../../../types/extended.type";
import EmployeeHeaderCard from "./cards/EmployeeHeaderCard";
import ProjectsCard from "./ProjectsCard";
import QuickStats from "./QuickStats";

interface EmployeeDetailsProps {
  employee: FullEmployee;
  onUpdated: () => void | Promise<void>;
}

const EmployeeDetails = ({ employee, onUpdated }: EmployeeDetailsProps) => {
  const handleSave = (data: FullEmployee) => {
    console.log("Saved employee details:", data);
    onUpdated?.(); // ✅ works for sync or async
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-medium text-gray-800">تفاصيل الموظف</h3>
        </div>

        <EmployeeHeaderCard employee={employee} onSave={handleSave} />

        <ProjectsCard projects={employee.projects || []} />

        <QuickStats employee={employee} />
      </div>
    </div>
  );
};

export default EmployeeDetails;
