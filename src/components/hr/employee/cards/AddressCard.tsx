import { Edit } from "lucide-react";
import { fullEmployee } from "../../../../types/extended.type";

interface AddressCardProps {
  employee: fullEmployee;
}

const AddressCard = ({ employee }: AddressCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border">
      <div className="flex justify-between items-start">
        <h4 className="text-md font-medium text-gray-800">العنوان</h4>
        <button className="text-gray-400 hover:text-gray-600">
          <Edit className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
        <div>
          <div className="text-xs text-gray-400">العنوان</div>
          <div className="mt-1">{employee.address ?? "غير محدد"}</div>
        </div>
      </div>
    </div>
  );
};

export default AddressCard;
