// pages/shop/products/ProductDetailsPage.tsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProduct } from "../../../hooks/shop/products/useProduct";
import LoadingPage from "../../../components/ui/LoadingPage";
import ErrorPage from "../../../components/ui/errorPage";
import ProductShow from "../../../components/shop/product/ProductShow";
import ProductEdit from "../../../components/shop/product/ProductEdit";

const ProductDetailsPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  const {
    product,
    loading,
    error,
    updateProduct,
    toggleProductActive,
    addSize,
    updateSize,
    deleteSize,
    toggleSizeActive,
    deleteProduct,
  } = useProduct(productId);

  if (loading && !product) return <LoadingPage />;
  if (error) return <ErrorPage error={error.message} />;
  if (!product) return <ErrorPage error="المنتج غير موجود" />;

  const handleDelete = async () => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    const success = await deleteProduct();
    if (success) navigate("/shops/products");
  };

  return (
    <div className="p-4 max-w-4xl mx-auto" dir="rtl">
      {isEditing ? (
        <ProductEdit
          product={product}
          onCancel={() => setIsEditing(false)}
          onSave={async (values) => {
            const result = await updateProduct(values);
            if (result) setIsEditing(false);
          }}
        />
      ) : (
        <ProductShow
          product={product}
          onEdit={() => setIsEditing(true)}
          onDelete={handleDelete}
          onToggleActive={toggleProductActive}
          onAddSize={addSize}
          onUpdateSize={updateSize}
          onDeleteSize={deleteSize}
          onToggleSizeActive={toggleSizeActive}
        />
      )}
    </div>
  );
};

export default ProductDetailsPage;
