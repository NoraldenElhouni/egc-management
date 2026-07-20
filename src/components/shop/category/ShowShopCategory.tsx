// components/shop/category/ShowShopCategory.tsx
import React from "react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import Button from "../../ui/Button";
import { Categories } from "../../../types/global.type";

interface ShowShopCategoryProps {
  category: Categories;
  divisionName?: string;
  onEdit: () => void;
  onDelete: () => void;
  deleting?: boolean;
}

const ShowShopCategory: React.FC<ShowShopCategoryProps> = ({
  category,
  divisionName,
  onEdit,
  onDelete,
  deleting = false,
}) => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">تفاصيل التصنيف</h1>
        <div className="flex gap-2">
          <Button onClick={onEdit}>تعديل</Button>
          <Button variant="error" loading={deleting} onClick={onDelete}>
            حذف
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          {category.icon_path ? (
            <DynamicIcon
              name={category.icon_path as IconName}
              className="w-8 h-8 text-foreground"
            />
          ) : (
            <span className="text-gray-400">-</span>
          )}
          <div>
            <p className="text-sm text-gray-500">اسم التصنيف</p>
            <p className="text-base">{category.name}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500">القسم</p>
          <p className="text-base">{divisionName ?? "-"}</p>
        </div>

        <div className="md:col-span-2">
          <p className="text-sm text-gray-500">الوصف</p>
          <p className="text-base">{category.description || "-"}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">الحالة</p>
          <p className="text-base">
            {category.is_active ? (
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

export default ShowShopCategory;
