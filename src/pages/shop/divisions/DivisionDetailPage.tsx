// components/shop/divisions/ShopDivisionPage.tsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDivision } from "../../../hooks/shop/divisions/useDivision";
import { useSpecializations } from "../../../hooks/useSpecializations";
import EditShopDivisionForm from "../../../components/shop/division/EditShopDivisionForm";
import ShowShopDivision from "../../../components/shop/division/ShowShopDivision";

const DivisionDetailPage = () => {
  const { divisionId } = useParams<{ divisionId: string }>();
  const navigate = useNavigate();

  if (!divisionId) return <div>not found</div>;

  const { division, loading, error, updateDivision, deleteDivision } =
    useDivision(divisionId);
  const { data: specializations } = useSpecializations("Vendor");
  const [isEditing, setIsEditing] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm("هل أنت متأكد من حذف هذا القسم؟");
    if (!confirmed) return;

    const success = await deleteDivision();
    if (!success) {
      alert("خطأ في حذف القسم: " + (error?.message ?? ""));
      return;
    }
    navigate("/shops/divisions");
  };

  if (loading && !division)
    return <div className="p-6 text-center">جاري التحميل...</div>;
  if (error)
    return (
      <div className="p-6 text-center text-error">
        حدث خطأ أثناء تحميل القسم
      </div>
    );
  if (!division)
    return <div className="p-6 text-center text-gray-400">القسم غير موجود</div>;

  const specializationName = specializations.find(
    (s) => s.id === division.specialization_id,
  )?.name;

  if (isEditing) {
    return (
      <EditShopDivisionForm
        defaultValues={{
          name: division.name,
          specialization_id: division.specialization_id,
          icon_path: division.icon_path,
          is_active: division.is_active,
        }}
        updateDivision={updateDivision}
        loading={loading}
        error={error}
        onSaved={() => setIsEditing(false)}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <ShowShopDivision
      division={division}
      specializationName={specializationName}
      onEdit={() => setIsEditing(true)}
      onDelete={handleDelete}
      deleting={loading}
    />
  );
};

export default DivisionDetailPage;
