// components/shop/divisions/ShopDivisionPage.tsx
import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDivision } from "../../../hooks/shop/divisions/useDivision";
import { useSpecializations } from "../../../hooks/useSpecializations";
import EditShopDivisionForm from "../../../components/shop/division/EditShopDivisionForm";
import ShowShopDivision from "../../../components/shop/division/ShowShopDivision";
import GenericTable from "../../../components/tables/table";
import { getCategoriesColumns } from "../../../components/tables/columns/shops/categories/CategoriesColumns";
import { useCategories } from "../../../hooks/shop/categories/useCategories";
import { useExpenses } from "../../../hooks/settings/useExpenses";

const DivisionDetailPage = () => {
  const { divisionId } = useParams<{ divisionId: string }>();
  const navigate = useNavigate();

  if (!divisionId) return <div>not found</div>;

  const {
    division,
    loading,
    error,
    updateDivision,
    deleteDivision,
    categories,
  } = useDivision(divisionId);
  const { toggleCategoryActive } = useCategories();
  const { expenses } = useExpenses();

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

  const columns = useMemo(
    () =>
      getCategoriesColumns(
        toggleCategoryActive,
        division ? { [division.id]: division.name } : {},
        (category) => `/shops/categories/${category.id}`, // override, optional
      ),
    [toggleCategoryActive, division],
  );

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

  const expenseName = expenses.find((e) => e.id === division.expense_id)?.name;

  if (isEditing) {
    return (
      <EditShopDivisionForm
        defaultValues={{
          name: division.name,
          specialization_id: division.specialization_id,
          icon_path: division.icon_path,
          is_active: division.is_active,
          expense_id: division.expense_id,
        }}
        expenses={expenses}
        updateDivision={updateDivision}
        loading={loading}
        error={error}
        onSaved={() => setIsEditing(false)}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-2">
      <ShowShopDivision
        division={division}
        specializationName={specializationName}
        expenseName={expenseName}
        onEdit={() => setIsEditing(true)}
        onDelete={handleDelete}
        deleting={loading}
      />

      <GenericTable
        data={categories ?? []}
        columns={columns}
        header={
          <h1 className="text-2xl font-bold text-gray-800">
            التصنيفات الفرعية
          </h1>
        }
        link="/shops/categories/new"
        linkLabel="+ إضافة تصنيف جديد"
        pageSize={10}
        enableSorting
        enablePagination
        enableFiltering
        enableRowSelection
        showGlobalFilter
      />
    </div>
  );
};

export default DivisionDetailPage;
