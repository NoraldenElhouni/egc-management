// components/shop/product/ProductShow.tsx
import { useState } from "react";
import { ProductWithRelations } from "../../../hooks/shop/products/useProduct";
import { ProductSizes } from "../../../types/global.type";
import { formatDate } from "../../../utils/helpper";
import { Pencil, Trash2, Plus, X, Check } from "lucide-react";

interface ProductShowProps {
  product: ProductWithRelations;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: (isActive: boolean) => void;
  onAddSize: (
    size: Omit<ProductSizes, "id" | "created_at" | "product_id">,
  ) => Promise<unknown>;
  onUpdateSize: (
    sizeId: string,
    values: Partial<Omit<ProductSizes, "id" | "created_at" | "product_id">>,
  ) => Promise<unknown>;
  onDeleteSize: (sizeId: string) => Promise<boolean>;
  onToggleSizeActive: (sizeId: string, isActive: boolean) => void;
}

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="text-sm font-medium text-gray-800">{value}</span>
  </div>
);

type SizeFormState = {
  name: string;
  unit: string;
  sku: string;
  price: number;
  image_path: string;
  is_active: boolean;
};

const EMPTY_SIZE_FORM: SizeFormState = {
  name: "",
  unit: "",
  sku: "",
  price: 0,
  image_path: "",
  is_active: true,
};

const ProductShow = ({
  product,
  onEdit,
  onDelete,
  onToggleActive,
  onAddSize,
  onUpdateSize,
  onDeleteSize,
  onToggleSizeActive,
}: ProductShowProps) => {
  const division = product.shop_subcategories?.shop_categories?.shop_divisions;
  const category = product.shop_subcategories?.shop_categories;
  const subcategory = product.shop_subcategories;
  const sizes = product.shop_product_sizes || [];

  const [editingSizeId, setEditingSizeId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<SizeFormState>(EMPTY_SIZE_FORM);

  const [isAddingSize, setIsAddingSize] = useState(false);
  const [addForm, setAddForm] = useState<SizeFormState>(EMPTY_SIZE_FORM);

  const [savingSize, setSavingSize] = useState(false);
  const [deletingSizeId, setDeletingSizeId] = useState<string | null>(null);
  const [sizeFormError, setSizeFormError] = useState<string | null>(null);

  const startEdit = (size: ProductSizes) => {
    setEditingSizeId(size.id);
    setEditForm({
      name: size.name,
      unit: size.unit,
      sku: size.sku,
      price: size.price,
      image_path: size.image_path || "",
      is_active: size.is_active,
    });
    setSizeFormError(null);
  };

  const cancelEdit = () => {
    setEditingSizeId(null);
    setEditForm(EMPTY_SIZE_FORM);
    setSizeFormError(null);
  };

  const validateForm = (form: SizeFormState) => {
    if (!form.name.trim()) return "اسم المقاس مطلوب";
    if (!form.unit.trim()) return "الوحدة مطلوبة";
    if (!form.sku.trim()) return "SKU مطلوب";
    if (form.price < 0) return "السعر يجب أن يكون أكبر من أو يساوي صفر";
    return null;
  };

  const saveEdit = async () => {
    if (!editingSizeId) return;
    const validationError = validateForm(editForm);
    if (validationError) {
      setSizeFormError(validationError);
      return;
    }

    setSavingSize(true);
    setSizeFormError(null);
    try {
      const result = await onUpdateSize(editingSizeId, {
        name: editForm.name.trim(),
        unit: editForm.unit.trim(),
        sku: editForm.sku.trim(),
        price: editForm.price,
        image_path: editForm.image_path.trim() || null,
        is_active: editForm.is_active,
      });
      if (result) cancelEdit();
      else setSizeFormError("حدث خطأ أثناء حفظ التعديلات");
    } finally {
      setSavingSize(false);
    }
  };

  const handleDeleteSize = async (sizeId: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المقاس؟")) return;
    setDeletingSizeId(sizeId);
    try {
      await onDeleteSize(sizeId);
    } finally {
      setDeletingSizeId(null);
    }
  };

  const startAdd = () => {
    setIsAddingSize(true);
    setAddForm(EMPTY_SIZE_FORM);
    setSizeFormError(null);
  };

  const cancelAdd = () => {
    setIsAddingSize(false);
    setAddForm(EMPTY_SIZE_FORM);
    setSizeFormError(null);
  };

  const saveAdd = async () => {
    const validationError = validateForm(addForm);
    if (validationError) {
      setSizeFormError(validationError);
      return;
    }

    setSavingSize(true);
    setSizeFormError(null);
    try {
      const result = await onAddSize({
        name: addForm.name.trim(),
        unit: addForm.unit.trim(),
        sku: addForm.sku.trim(),
        price: addForm.price,
        image_path: addForm.image_path.trim() || null,
        is_active: addForm.is_active,
      });
      if (result) cancelAdd();
      else setSizeFormError("حدث خطأ أثناء إضافة المقاس");
    } finally {
      setSavingSize(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {product.image_path ? (
            <img
              src={product.image_path}
              alt={product.name}
              className="w-20 h-20 object-cover rounded-lg border"
            />
          ) : (
            <div className="w-20 h-20 rounded-lg border bg-gray-50 flex items-center justify-center text-gray-300 text-xs">
              لا توجد صورة
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{product.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {category?.name || "-"} ◄ {subcategory?.name || "-"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            تعديل
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="px-4 py-2 text-sm rounded-md bg-red-50 text-red-600 hover:bg-red-100"
          >
            حذف
          </button>
        </div>
      </div>

      {/* Status toggle */}
      <div className="bg-white rounded-lg border p-4 flex items-center justify-between">
        <span className="text-sm text-gray-600">حالة المنتج</span>
        <button
          type="button"
          dir="ltr"
          onClick={() => onToggleActive(!product.is_active)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            product.is_active ? "bg-green-600" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              product.is_active ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Basic info */}
      <div className="bg-white rounded-lg border p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          معلومات أساسية
        </h2>
        <InfoRow label="اسم المنتج" value={product.name} />
        <InfoRow label="القسم" value={division?.name || "-"} />
        <InfoRow label="التصنيف الرئيسي" value={category?.name || "-"} />
        <InfoRow label="التصنيف الفرعي" value={subcategory?.name || "-"} />
        <InfoRow label="الوصف" value={product.description || "لا يوجد وصف"} />
        <InfoRow
          label="الحالة"
          value={
            <span
              className={product.is_active ? "text-green-600" : "text-gray-500"}
            >
              {product.is_active ? "نشط" : "غير نشط"}
            </span>
          }
        />
        <InfoRow label="تاريخ الإنشاء" value={formatDate(product.created_at)} />
      </div>

      {/* Sizes */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">
            الأحجام / المقاسات ({sizes.length})
          </h2>
          {!isAddingSize && (
            <button
              type="button"
              onClick={startAdd}
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              <Plus className="w-4 h-4" /> إضافة مقاس
            </button>
          )}
        </div>

        {sizeFormError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-md p-2 mb-3">
            {sizeFormError}
          </div>
        )}

        {/* Add size form */}
        {isAddingSize && (
          <div className="border border-blue-200 bg-blue-50/30 rounded-lg p-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                اسم المقاس
              </label>
              <input
                type="text"
                value={addForm.name}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, name: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">الوحدة</label>
              <input
                type="text"
                value={addForm.unit}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, unit: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">SKU</label>
              <input
                type="text"
                value={addForm.sku}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, sku: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">السعر</label>
              <input
                type="number"
                step="0.01"
                value={addForm.price}
                onChange={(e) =>
                  setAddForm((f) => ({
                    ...f,
                    price: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">
                مسار الصورة (اختياري)
              </label>
              <input
                type="text"
                value={addForm.image_path}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, image_path: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-between mt-1">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={addForm.is_active}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, is_active: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                نشط
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cancelAdd}
                  disabled={savingSize}
                  className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> إلغاء
                </button>
                <button
                  type="button"
                  onClick={saveAdd}
                  disabled={savingSize}
                  className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  {savingSize ? "جارٍ الحفظ..." : "حفظ"}
                </button>
              </div>
            </div>
          </div>
        )}

        {sizes.length === 0 && !isAddingSize ? (
          <p className="text-sm text-gray-400">
            لا توجد أحجام مضافة لهذا المنتج
          </p>
        ) : sizes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-gray-500 border-b">
                  <th className="py-2 pr-2">الاسم</th>
                  <th className="py-2">الوحدة</th>
                  <th className="py-2">SKU</th>
                  <th className="py-2">السعر</th>
                  <th className="py-2">الحالة</th>
                  <th className="py-2">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {sizes.map((size) =>
                  editingSizeId === size.id ? (
                    <tr
                      key={size.id}
                      className="border-b last:border-0 bg-blue-50/30"
                    >
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, name: e.target.value }))
                          }
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2">
                        <input
                          type="text"
                          value={editForm.unit}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, unit: e.target.value }))
                          }
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2">
                        <input
                          type="text"
                          value={editForm.sku}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, sku: e.target.value }))
                          }
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.price}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              price: parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="w-24 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2">
                        <label className="flex items-center gap-1 text-xs text-gray-600">
                          <input
                            type="checkbox"
                            checked={editForm.is_active}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                is_active: e.target.checked,
                              }))
                            }
                            className="h-3.5 w-3.5 rounded border-gray-300"
                          />
                          نشط
                        </label>
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={saveEdit}
                            disabled={savingSize}
                            title="حفظ"
                            className="text-green-600 hover:text-green-700 disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={savingSize}
                            title="إلغاء"
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={size.id} className="border-b last:border-0">
                      <td className="py-2 pr-2 font-medium text-gray-800">
                        {size.name}
                      </td>
                      <td className="py-2 text-gray-600">{size.unit}</td>
                      <td className="py-2 text-gray-600">{size.sku}</td>
                      <td className="py-2 text-gray-600">
                        {size.price.toLocaleString("ar-LY")} د.ل
                      </td>
                      <td className="py-2">
                        <button
                          type="button"
                          dir="ltr"
                          onClick={() =>
                            onToggleSizeActive(size.id, !size.is_active)
                          }
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            size.is_active ? "bg-green-600" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              size.is_active ? "translate-x-5" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => startEdit(size)}
                            title="تعديل"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSize(size.id)}
                            disabled={deletingSizeId === size.id}
                            title="حذف"
                            className="text-red-600 hover:text-red-700 disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ProductShow;
