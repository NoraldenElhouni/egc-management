import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCategory } from "../../../hooks/shop/categories/useCategory";
import { useDivisions } from "../../../hooks/shop/divisions/useDivisions";
import EditShopCategoryForm from "../../../components/shop/category/EditShopCategoryForm";
import ShowShopCategory from "../../../components/shop/category/ShowShopCategory";

const CategoryDetailPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();

  if (!categoryId) return <div>not found</div>;

  const { category, loading, error, updateCategory, deleteCategory } =
    useCategory(categoryId);
  const { divisions } = useDivisions();
  const [isEditing, setIsEditing] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm("هل أنت متأكد من حذف هذا التصنيف؟");
    if (!confirmed) return;

    const success = await deleteCategory();
    if (!success) {
      alert("خطأ في حذف التصنيف: " + (error?.message ?? ""));
      return;
    }
    navigate("/shops/categories");
  };

  if (loading && !category)
    return <div className="p-6 text-center">جاري التحميل...</div>;
  if (error)
    return (
      <div className="p-6 text-center text-error">
        حدث خطأ أثناء تحميل التصنيف
      </div>
    );
  if (!category)
    return (
      <div className="p-6 text-center text-gray-400">التصنيف غير موجود</div>
    );

  const divisionName = divisions.find(
    (d) => d.id === category.division_id,
  )?.name;

  if (isEditing) {
    return (
      <EditShopCategoryForm
        defaultValues={{
          name: category.name,
          description: category.description,
          icon_path: category.icon_path,
          division_id: category.division_id,
          is_active: category.is_active,
        }}
        updateCategory={updateCategory}
        loading={loading}
        error={error}
        onSaved={() => setIsEditing(false)}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <ShowShopCategory
      category={category}
      divisionName={divisionName}
      onEdit={() => setIsEditing(true)}
      onDelete={handleDelete}
      deleting={loading}
    />
  );
};

export default CategoryDetailPage;
