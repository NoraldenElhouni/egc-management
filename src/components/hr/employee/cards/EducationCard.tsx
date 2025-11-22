import { Edit } from "lucide-react";
import { fullEmployee } from "../../../../types/extended.type";

interface EducationCardProps {
  employee: fullEmployee;
}

const EducationCard = ({ employee }: EducationCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border">
      <div className="flex justify-between items-start">
        <h4 className="text-md font-medium text-gray-800">التعليم</h4>
        <button className="text-gray-400 hover:text-gray-600">
          <Edit className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 space-y-4 text-sm text-gray-700">
        {employee.employee_certifications &&
        employee.employee_certifications.length > 0 ? (
          employee.employee_certifications.map((ed, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-md">
              <div className="font-semibold">{ed.certification}</div>
              <div className="text-xs text-gray-500">IT</div>
              <div className="text-xs text-gray-500 mt-2">GPA 3.3 • 2025</div>
            </div>
          ))
        ) : (
          <div className="text-gray-400">لا يوجد شهادات تعليمية</div>
        )}
      </div>
    </div>
  );
};

export default EducationCard;
