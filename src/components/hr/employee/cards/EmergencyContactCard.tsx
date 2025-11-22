import { Edit } from "lucide-react";
import { fullEmployee } from "../../../../types/extended.type";

interface EmergencyContactCardProps {
  employee: fullEmployee;
}

const EmergencyContactCard = ({ employee }: EmergencyContactCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border">
      <div className="flex justify-between items-start">
        <h4 className="text-md font-medium text-gray-800">
          جهة الاتصال في حالة الطوارئ
        </h4>
        <button className="text-gray-400 hover:text-gray-600">
          <Edit className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-700">
        <div className="text-xs text-gray-400">الاسم</div>
        <div className="mt-1">{employee.emergency_contact ?? "غير محدد"}</div>

        <div className="mt-3 text-xs text-gray-400">العلاقة</div>
        <div className="mt-1">
          {employee.emergency_contact_relation ?? "غير محدد"}
        </div>

        <div className="mt-3 text-xs text-gray-400">رقم الهاتف</div>
        <div className="mt-1">
          {employee.emergency_contact_phone ?? "غير محدد"}
        </div>
      </div>
    </div>
  );
};

export default EmergencyContactCard;
