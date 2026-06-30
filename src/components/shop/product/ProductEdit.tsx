// components/shop/products/ProductEdit.tsx
import { useState } from "react";
import { useDivisions } from "../../../hooks/shop/divisions/useDivisions";
import { useCategories } from "../../../hooks/shop/categories/useCategories";
import { ProductWithRelations } from "../../../hooks/shop/products/useProduct";
import { useSubcategories } from "../../../hooks/shop/subcategories/useSubcategories";

interface ProductEditValues {
  name: string;
  description?: string | null;
  image_path?: string | null;
  subcategory_id: string;
  is_active?: boolean;
}

interface ProductEditProps {
  product: ProductWithRelations;
  onCancel: () => void;
  onSave: (values: ProductEditValues) => Promise<void>;
}

const ProductEdit = ({ product, onCancel, onSave }: ProductEditProps) => {
  const { divisions } = useDivisions();
  const { categories } = useCategories();
  const { subcategories } = useSubcategories();

  const initialCategory = product.shop_subcategories?.category_id || "";
  const initialDivision =
    product.shop_subcategories?.shop_categories?.division_id || "";

  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description || "");
  const [imagePath, setImagePath] = useState(product.image_path || "");
  const [divisionId, setDivisionId] = useState(initialDivision);
  const [categoryId, setCategoryId] = useState(initialCategory);
  const [subcategoryId, setSubcategoryId] = useState(
    product.subcategory_id || "",
  );
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredCategories = categories.filter(
    (c) => c.division_id === divisionId,
  );
  const filteredSubcategories = subcategories.filter(
    (s) => s.category_id === categoryId,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("اسم المنتج مطلوب");
      return;
    }
    if (!subcategoryId) {
      setFormError("يجب اختيار التصنيف الفرعي");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || null,
        image_path: imagePath.trim() || null,
        subcategory_id: subcategoryId,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">تعديل المنتج</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>
      </div>

      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-md p-3">
          {formError}
        </div>
      )}

      <div className="bg-white rounded-lg border p-4 space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">اسم المنتج</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">
            رابط الصورة
          </label>
          <input
            type="text"
            value={imagePath}
            onChange={(e) => setImagePath(e.target.value)}
            placeholder="https://..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">القسم</label>
            <select
              value={divisionId}
              onChange={(e) => {
                setDivisionId(e.target.value);
                setCategoryId("");
                setSubcategoryId("");
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">اختر القسم</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              التصنيف الرئيسي
            </label>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setSubcategoryId("");
              }}
              disabled={!divisionId}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            >
              <option value="">اختر التصنيف</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              التصنيف الفرعي
            </label>
            <select
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
              disabled={!categoryId}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            >
              <option value="">اختر التصنيف الفرعي</option>
              {filteredSubcategories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">الوصف</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </form>
  );
};

export default ProductEdit;
