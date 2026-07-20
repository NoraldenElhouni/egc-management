// components/shop/division/ShowShopDivision.tsx
import React from "react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import Button from "../../ui/Button";

interface ShowShopDivisionProps {
  division: {
    name: string;
    icon_path: string | null;
    specialization_id: string | null;
    is_active: boolean;
  };
  specializationName?: string;
  onEdit: () => void;
  onDelete: () => void;
  deleting?: boolean;
}

const ShowShopDivision: React.FC<ShowShopDivisionProps> = ({
  division,
  specializationName,
  onEdit,
  onDelete,
  deleting = false,
}) => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">تفاصيل القسم</h1>
        <div className="flex gap-2">
          <Button onClick={onEdit}>تعديل</Button>
          <Button variant="error" loading={deleting} onClick={onDelete}>
            حذف
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          {division.icon_path ? (
            <DynamicIcon
              name={division.icon_path as IconName}
              className="w-8 h-8 text-foreground"
            />
          ) : (
            <span className="text-gray-400">-</span>
          )}
          <div>
            <p className="text-sm text-gray-500">اسم القسم</p>
            <p className="text-base">{division.name}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500">التخصص</p>
          <p className="text-base">{specializationName ?? "-"}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">الحالة</p>
          <p className="text-base">
            {division.is_active ? (
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

export default ShowShopDivision;
