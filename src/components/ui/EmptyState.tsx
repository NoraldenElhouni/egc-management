import { Building2 } from "lucide-react";

const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
      <div className="bg-gray-50 p-4 rounded-full mb-3">
        <Building2 size={32} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900">لا توجد مشاريع</h3>
      <p className="text-sm text-gray-500">
        لم يتم العثور على أي مشاريع مرتبطة حالياً.
      </p>
    </div>
  );
};

export default EmptyState;
