// hooks/shop/vendors/useVendors.ts
import { useState, useEffect, useCallback } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabaseClient";
import { VendorsWithSpecializations } from "../../../types/extended.type";

const VENDORS_SELECT = `
  *,
  users (
    id,
    user_specializations (
      specializations (
        id,
        name
      )
    )
  )
`;

export function useVendors() {
  const [vendors, setVendors] = useState<VendorsWithSpecializations[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("vendors")
        .select(VENDORS_SELECT)
        .order("vendor_name", { ascending: true });

      if (fetchError) {
        console.error("Error fetching vendors:", fetchError);
        setError(fetchError);
        return;
      }

      setVendors((data as VendorsWithSpecializations[]) || []);
    } catch (err) {
      console.error("Unexpected error fetching vendors:", err);
      setError(err as PostgrestError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const toggleVendorShop = useCallback(async (id: string, isShop: boolean) => {
    setError(null);

    // Optimistic update
    setVendors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, is_shop: isShop } : v)),
    );

    try {
      const { data, error: updateError } = await supabase
        .from("vendors")
        .update({ is_shop: isShop })
        .eq("id", id)
        .select(VENDORS_SELECT)
        .single();

      if (updateError) {
        console.error("Error toggling vendor shop status:", updateError);
        setError(updateError);
        // Revert on failure
        setVendors((prev) =>
          prev.map((v) => (v.id === id ? { ...v, is_shop: !isShop } : v)),
        );
        return null;
      }

      setVendors((prev) =>
        prev.map((v) =>
          v.id === id ? (data as VendorsWithSpecializations) : v,
        ),
      );
      return data;
    } catch (err) {
      console.error("Unexpected error toggling vendor shop status:", err);
      setError(err as PostgrestError);
      setVendors((prev) =>
        prev.map((v) => (v.id === id ? { ...v, is_shop: !isShop } : v)),
      );
      return null;
    }
  }, []);

  return { vendors, loading, error, refetch: fetchVendors, toggleVendorShop };
}
