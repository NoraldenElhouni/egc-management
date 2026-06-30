// types/schema/shop/product.schema.ts
import { z } from "zod";

export const ShopProductSizeSchema = z.object({
  name: z.string().min(1, "اسم المقاس/الوحدة مطلوب"),
  unit: z.string().min(1, "الوحدة مطلوبة"),
  sku: z.string().min(1, "SKU مطلوب"),
  price: z.number().min(0, "السعر يجب ان يكون 0 أو أكثر"),
  image_path: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

export const ShopProductSchema = z.object({
  name: z.string().min(1, "اسم المنتج مطلوب"),
  description: z.string().nullable().optional(),
  image_path: z.string().nullable().optional(),
  subcategory_id: z.string().min(1, "التصنيف الفرعي مطلوب"),
  is_active: z.boolean().optional(),
  sizes: z.array(ShopProductSizeSchema).min(1, "يجب اضافة مقاس واحد على الأقل"),
});

export type ShopProductSizeFormValues = z.infer<typeof ShopProductSizeSchema>;
export type ShopProductFormValues = z.infer<typeof ShopProductSchema>;
