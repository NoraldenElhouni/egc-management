import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSubcategory } from "../../../hooks/shop/subcategories/useSubcategory";
import { useCategories } from "../../../hooks/shop/categories/useCategories";
import EditShopSubcategoryForm from "../../../components/shop/subcategory/EditShopSubcategoryForm";
import ShowShopSubcategory from "../../../components/shop/subcategory/ShowShopSubcategory";

const SubcategoryDetailPage = () => {
  const { subcategoryId } = useParams<{ subcategoryId: string }>();
  const navigate = useNavigate();

  if (!subcategoryId) return <div>not found</div>;

  const { subcategory, loading, error, updateSubcategory, deleteSubcategory } =
    useSubcategory(subcategoryId);
  const { categories } = useCategories();
  const [isEditing, setIsEditing] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm("هل أنت متأكد من حذف هذا التصنيف الفرعي؟");
    if (!confirmed) return;

    const success = await deleteSubcategory();
    if (!success) {
      alert("خطأ في حذف التصنيف الفرعي: " + (error?.message ?? ""));
      return;
    }
    navigate("/shops/subcategories");
  };

  if (loading && !subcategory)
    return <div className="p-6 text-center">جاري التحميل...</div>;
  if (error)
    return (
      <div className="p-6 text-center text-error">
        حدث خطأ أثناء تحميل التصنيف الفرعي
      </div>
    );
  if (!subcategory)
    return (
      <div className="p-6 text-center text-gray-400">
        التصنيف الفرعي غير موجود
      </div>
    );

  const categoryName = categories.find(
    (c) => c.id === subcategory.category_id,
  )?.name;

  if (isEditing) {
    return (
      <EditShopSubcategoryForm
        defaultValues={{
          name: subcategory.name,
          description: subcategory.description,
          category_id: subcategory.category_id,
          is_active: subcategory.is_active,
        }}
        updateSubcategory={updateSubcategory}
        loading={loading}
        error={error}
        onSaved={() => setIsEditing(false)}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <ShowShopSubcategory
      subcategory={subcategory}
      categoryName={categoryName}
      onEdit={() => setIsEditing(true)}
      onDelete={handleDelete}
      deleting={loading}
    />
  );
};

export default SubcategoryDetailPage;
