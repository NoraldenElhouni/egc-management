import { useEffect, useState } from "react";
import { Products } from "../../../types/global.type";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabaseClient";

export function useProducts() {
  const [products, setProducts] = useState<Products[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: productsError } = await supabase
          .from("shop_products")
          .select("*");

        if (productsError) {
          console.error("Error fetching shop products:", productsError);
          setError(productsError);
          return;
        }

        setProducts(data || []);
      } catch (err) {
        console.error("Unexpected error fetching shop products:", err);
        setError(err as PostgrestError);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return { products, loading, error };
}
