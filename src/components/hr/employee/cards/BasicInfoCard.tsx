import { ArrowRight, Edit, Phone, User } from "lucide-react";
import { fullEmployee } from "../../../../types/extended.type";

interface BasicInfoCardProps {
  employee: fullEmployee;
}
const BasicInfoCard = ({ employee }: BasicInfoCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-md font-medium text-gray-800">
          المعلومات الأساسية
        </h4>
        <button className="text-gray-400 hover:text-gray-600">
          <Edit className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-center">
        {/* Avatar + name */}
        <div className="flex items-center gap-4 col-span-1 md:col-span-2">
          <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-primary/10 to-primary/50 flex items-center justify-center text-2xl font-semibold text-foreground">
            {employee.first_name?.[0] ?? ""}
            {employee.last_name?.[0] ?? ""}
          </div>
          <div>
            <div className="text-xl font-semibold text-gray-800">
              {employee.first_name ?? "غير محدد"} {employee.last_name ?? ""}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {employee.id?.slice(0, 13) ?? "N/A"}
            </div>

            <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span>{employee.gender ?? "غير محدد"}</span>
              </div>

              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-gray-400" />
                <span>{employee.email ?? "غير محدد"}</span>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{employee.phone_number ?? "غير محدد"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-1 md:col-span-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
            <div className="space-y-2">
              <div className="text-xs text-gray-400">مكان الميلاد</div>
              <div>{employee.place_of_birth ?? "غير محدد"}</div>

              <div className="mt-3 text-xs text-gray-400">تاريخ الميلاد</div>
              <div>{employee.dob ?? "غير محدد"}</div>

              <div className="mt-3 text-xs text-gray-400">فصيلة الدم</div>
              <div>{employee.blood_type ?? "غير محدد"}</div>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-gray-400">الحالة الاجتماعية</div>
              <div>{employee.marital_status ?? "غير محدد"}</div>

              <div className="mt-3 text-xs text-gray-400">الجنسية</div>
              <div>{employee.nationality ?? "غير محدد"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoCard;
