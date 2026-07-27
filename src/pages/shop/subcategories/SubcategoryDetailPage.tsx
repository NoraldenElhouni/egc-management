import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSubcategory } from "../../../hooks/shop/subcategories/useSubcategory";
import { useCategories } from "../../../hooks/shop/categories/useCategories";
import { useProducts } from "../../../hooks/shop/products/useProducts";
import EditShopSubcategoryForm from "../../../components/shop/subcategory/EditShopSubcategoryForm";
import ShowShopSubcategory from "../../../components/shop/subcategory/ShowShopSubcategory";
import GenericTable from "../../../components/tables/table";
import { getProductsColumns } from "../../../components/tables/columns/shops/products/ProductsColumns";

const SubcategoryDetailPage = () => {
  const { subcategoryId } = useParams<{ subcategoryId: string }>();
  const navigate = useNavigate();

  if (!subcategoryId) return <div>not found</div>;

  const { subcategory, loading, error, updateSubcategory, deleteSubcategory } =
    useSubcategory(subcategoryId);
  const { categories } = useCategories();
  const { products, toggleProductActive } = useProducts();
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

  const subcategoryProducts = useMemo(
    () => products.filter((p) => p.subcategory_id === subcategoryId),
    [products, subcategoryId],
  );

  const columns = useMemo(
    () =>
      getProductsColumns(
        toggleProductActive,
        (product) => `/shops/products/${product.id}`,
      ),
    [toggleProductActive, subcategory],
  );

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
    <div className="p-4 max-w-4xl mx-auto space-y-2">
      <ShowShopSubcategory
        subcategory={subcategory}
        categoryName={categoryName}
        onEdit={() => setIsEditing(true)}
        onDelete={handleDelete}
        deleting={loading}
      />

      <GenericTable
        data={subcategoryProducts}
        columns={columns}
        header={<h1 className="text-2xl font-bold text-gray-800">المنتجات</h1>}
        link="./new"
        linkLabel="+ إضافة منتج جديد"
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

export default SubcategoryDetailPage;
