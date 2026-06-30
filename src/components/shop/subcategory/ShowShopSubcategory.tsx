import React from "react";
import Button from "../../ui/Button";

interface ShowShopSubcategoryProps {
  subcategory: {
    name: string;
    description: string | null;
    category_id: string;
    is_active: boolean;
  };
  categoryName?: string;
  onEdit: () => void;
  onDelete: () => void;
  deleting?: boolean;
}

const ShowShopSubcategory: React.FC<ShowShopSubcategoryProps> = ({
  subcategory,
  categoryName,
  onEdit,
  onDelete,
  deleting = false,
}) => {
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">تفاصيل التصنيف الفرعي</h1>
        <div className="flex gap-2">
          <Button onClick={onEdit}>تعديل</Button>
          <Button variant="error" loading={deleting} onClick={onDelete}>
            حذف
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">اسم التصنيف الفرعي</p>
          <p className="text-base">{subcategory.name}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">التصنيف الرئيسي</p>
          <p className="text-base">{categoryName ?? "-"}</p>
        </div>

        <div className="md:col-span-2">
          <p className="text-sm text-gray-500">الوصف</p>
          <p className="text-base">{subcategory.description || "-"}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">الحالة</p>
          <p className="text-base">
            {subcategory.is_active ? (
              <span className="text-success">نشط</span>
            ) : (
              <span className="text-error">غير نشط</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShowShopSubcategory;
