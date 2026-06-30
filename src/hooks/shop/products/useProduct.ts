// hooks/shop/products/useProduct.ts
import { useState, useEffect, useCallback } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { Products, ProductSizes } from "../../../types/global.type";
import { supabase } from "../../../lib/supabaseClient";

export type ProductWithRelations = Products & {
  shop_subcategories?: {
    id: string;
    name: string;
    category_id: string;
    shop_categories?: {
      id: string;
      name: string;
      division_id: string;
      shop_divisions?: {
        id: string;
        name: string;
      } | null;
    } | null;
  } | null;
  shop_product_sizes?: ProductSizes[];
};

const PRODUCT_SELECT = `
  *,
  shop_subcategories (
    id,
    name,
    category_id,
    shop_categories (
      id,
      name,
      division_id,
      shop_divisions (
        id,
        name
      )
    )
  ),
  shop_product_sizes (
    id,
    name,
    unit,
    sku,
    is_active,
    price,
    image_path,
    created_at
  )
`;

export function useProduct(id: string | undefined) {
  const [product, setProduct] = useState<ProductWithRelations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("shop_products")
        .select(PRODUCT_SELECT)
        .eq("id", id)
        .single();

      if (fetchError) {
        console.error("Error fetching product:", fetchError);
        setError(fetchError);
        return;
      }

      setProduct(data as ProductWithRelations);
    } catch (err) {
      console.error("Unexpected error fetching product:", err);
      setError(err as PostgrestError);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const updateProduct = useCallback(
    async (values: {
      name: string;
      description?: string | null;
      image_path?: string | null;
      subcategory_id: string;
      is_active?: boolean;
    }) => {
      if (!id) return null;
      setLoading(true);
      setError(null);

      try {
        const { data, error: updateError } = await supabase
          .from("shop_products")
          .update(values)
          .eq("id", id)
          .select(PRODUCT_SELECT)
          .single();

        if (updateError) {
          console.error("Error updating product:", updateError);
          setError(updateError);
          return null;
        }

        setProduct(data as ProductWithRelations);
        return data;
      } catch (err) {
        console.error("Unexpected error updating product:", err);
        setError(err as PostgrestError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [id],
  );

  const toggleProductActive = useCallback(
    async (isActive: boolean) => {
      if (!id) return null;
      setError(null);

      setProduct((prev) => (prev ? { ...prev, is_active: isActive } : prev));

      try {
        const { data, error: updateError } = await supabase
          .from("shop_products")
          .update({ is_active: isActive })
          .eq("id", id)
          .select(PRODUCT_SELECT)
          .single();

        if (updateError) {
          console.error("Error toggling product status:", updateError);
          setError(updateError);
          setProduct((prev) =>
            prev ? { ...prev, is_active: !isActive } : prev,
          );
          return null;
        }

        setProduct(data as ProductWithRelations);
        return data;
      } catch (err) {
        console.error("Unexpected error toggling product status:", err);
        setError(err as PostgrestError);
        setProduct((prev) => (prev ? { ...prev, is_active: !isActive } : prev));
        return null;
      }
    },
    [id],
  );

  const addSize = useCallback(
    async (size: Omit<ProductSizes, "id" | "created_at" | "product_id">) => {
      if (!id) return null;
      setError(null);

      try {
        const { data, error: insertError } = await supabase
          .from("shop_product_sizes")
          .insert([{ ...size, product_id: id }])
          .select()
          .single();

        if (insertError) {
          console.error("Error adding size:", insertError);
          setError(insertError);
          return null;
        }

        setProduct((prev) =>
          prev
            ? {
                ...prev,
                shop_product_sizes: [
                  ...(prev.shop_product_sizes || []),
                  data as ProductSizes,
                ],
              }
            : prev,
        );
        return data;
      } catch (err) {
        console.error("Unexpected error adding size:", err);
        setError(err as PostgrestError);
        return null;
      }
    },
    [id],
  );

  const updateSize = useCallback(
    async (
      sizeId: string,
      values: Partial<Omit<ProductSizes, "id" | "created_at" | "product_id">>,
    ) => {
      setError(null);

      try {
        const { data, error: updateError } = await supabase
          .from("shop_product_sizes")
          .update(values)
          .eq("id", sizeId)
          .select()
          .single();

        if (updateError) {
          console.error("Error updating size:", updateError);
          setError(updateError);
          return null;
        }

        setProduct((prev) =>
          prev
            ? {
                ...prev,
                shop_product_sizes: prev.shop_product_sizes?.map((s) =>
                  s.id === sizeId ? (data as ProductSizes) : s,
                ),
              }
            : prev,
        );
        return data;
      } catch (err) {
        console.error("Unexpected error updating size:", err);
        setError(err as PostgrestError);
        return null;
      }
    },
    [],
  );

  const deleteSize = useCallback(
    async (sizeId: string) => {
      setError(null);

      const prevProduct = product;

      setProduct((prev) =>
        prev
          ? {
              ...prev,
              shop_product_sizes: prev.shop_product_sizes?.filter(
                (s) => s.id !== sizeId,
              ),
            }
          : prev,
      );

      try {
        const { error: deleteError } = await supabase
          .from("shop_product_sizes")
          .delete()
          .eq("id", sizeId);

        if (deleteError) {
          console.error("Error deleting size:", deleteError);
          setError(deleteError);
          setProduct(prevProduct);
          return false;
        }

        return true;
      } catch (err) {
        console.error("Unexpected error deleting size:", err);
        setError(err as PostgrestError);
        setProduct(prevProduct);
        return false;
      }
    },
    [product],
  );

  const toggleSizeActive = useCallback(
    async (sizeId: string, isActive: boolean) => {
      setError(null);

      setProduct((prev) =>
        prev
          ? {
              ...prev,
              shop_product_sizes: prev.shop_product_sizes?.map((s) =>
                s.id === sizeId ? { ...s, is_active: isActive } : s,
              ),
            }
          : prev,
      );

      try {
        const { error: updateError } = await supabase
          .from("shop_product_sizes")
          .update({ is_active: isActive })
          .eq("id", sizeId);

        if (updateError) {
          console.error("Error toggling size status:", updateError);
          setError(updateError);
          setProduct((prev) =>
            prev
              ? {
                  ...prev,
                  shop_product_sizes: prev.shop_product_sizes?.map((s) =>
                    s.id === sizeId ? { ...s, is_active: !isActive } : s,
                  ),
                }
              : prev,
          );
        }
      } catch (err) {
        console.error("Unexpected error toggling size status:", err);
        setError(err as PostgrestError);
      }
    },
    [],
  );

  const deleteProduct = useCallback(async () => {
    if (!id) return false;
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from("shop_products")
        .delete()
        .eq("id", id);

      if (deleteError) {
        console.error("Error deleting product:", deleteError);
        setError(deleteError);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Unexpected error deleting product:", err);
      setError(err as PostgrestError);
      return false;
    }
  }, [id]);

  return {
    product,
    loading,
    error,
    refetch: fetchProduct,
    updateProduct,
    toggleProductActive,
    addSize,
    updateSize,
    deleteSize,
    toggleSizeActive,
    deleteProduct,
  };
}
