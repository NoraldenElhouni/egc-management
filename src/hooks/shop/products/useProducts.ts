// hooks/shop/products/useProducts.ts
import { useState, useEffect, useCallback } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { Products, ProductSizes } from "../../../types/global.type";
import { supabase } from "../../../lib/supabaseClient";
import { ShopProductFormValues } from "../../../types/schema/shop/product.schema";

const PRODUCTS_SELECT = `
  *,
  shop_subcategories (
    id,
    name,
    category_id,
    shop_categories (
      id,
      name
    )
  )
`;

export function useProducts() {
  const [products, setProducts] = useState<Products[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from("shop_products")
          .select(PRODUCTS_SELECT);

        if (fetchError) {
          console.error("Error fetching shop products:", fetchError);
          setError(fetchError);
          return;
        }

        setProducts((data as Products[]) || []);
      } catch (err) {
        console.error("Unexpected error fetching shop products:", err);
        setError(err as PostgrestError);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const addProduct = async (formValues: ShopProductFormValues) => {
    setLoading(true);
    setError(null);

    const { sizes, ...productFields } = formValues;

    try {
      const { data: product, error: insertError } = await supabase
        .from("shop_products")
        .insert([productFields])
        .select(PRODUCTS_SELECT)
        .single();

      if (insertError || !product) {
        console.error("Error adding shop product:", insertError);
        setError(insertError);
        return null;
      }

      const sizesPayload = sizes.map((s) => ({
        ...s,
        product_id: product.id,
      }));

      const { data: insertedSizes, error: sizesError } = await supabase
        .from("shop_product_sizes")
        .insert(sizesPayload)
        .select();

      if (sizesError) {
        console.error("Error adding product sizes:", sizesError);
        setError(sizesError);
        return null;
      }

      setProducts((prev) => [...prev, product as Products]);
      return { product, sizes: insertedSizes as ProductSizes[] };
    } catch (err) {
      console.error("Unexpected error adding shop product:", err);
      setError(err as PostgrestError);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const toggleProductActive = useCallback(
    async (id: string, isActive: boolean) => {
      setError(null);

      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: isActive } : p)),
      );

      try {
        const { data, error: updateError } = await supabase
          .from("shop_products")
          .update({ is_active: isActive })
          .eq("id", id)
          .select(PRODUCTS_SELECT)
          .single();

        if (updateError) {
          console.error("Error toggling product status:", updateError);
          setError(updateError);
          setProducts((prev) =>
            prev.map((p) => (p.id === id ? { ...p, is_active: !isActive } : p)),
          );
          return null;
        }

        return data;
      } catch (err) {
        console.error("Unexpected error toggling product status:", err);
        setError(err as PostgrestError);
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, is_active: !isActive } : p)),
        );
        return null;
      }
    },
    [],
  );

  return { products, loading, error, addProduct, toggleProductActive };
}
