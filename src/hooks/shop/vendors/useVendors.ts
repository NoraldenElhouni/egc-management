// hooks/shop/vendors/useVendors.ts
import { useState, useEffect, useCallback } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabaseClient";
import { VendorsWithSpecializations } from "../../../types/extended.type";

const VENDORS_SELECT = `
  *,
  specializations(*),
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

type ActionError = { message: string };

export function useVendors() {
  const [vendors, setVendors] = useState<VendorsWithSpecializations[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  // Separate from `error` on purpose: `error` = page can't load data (blocking).
  // `actionError` = a single mutation (toggle/edit) failed (non-blocking, transient).
  const [actionError, setActionError] = useState<ActionError | null>(null);

  const clearActionError = useCallback(() => setActionError(null), []);

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

      setVendors((data as unknown as VendorsWithSpecializations[]) || []);
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

  const toggleVendorShop = useCallback(
    async (id: string, isShop: boolean) => {
      setActionError(null);

      if (isShop) {
        const vendor = vendors.find((v) => v.id === id);
        if (!vendor?.flow) {
          setActionError({
            message: "يجب اختيار مسار العمل أولاً قبل تفعيل المتجر",
          });
          return { success: false as const };
        }
      }

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
          setActionError({ message: "تعذر تحديث حالة المتجر" });
          setVendors((prev) =>
            prev.map((v) => (v.id === id ? { ...v, is_shop: !isShop } : v)),
          );
          return { success: false as const };
        }

        setVendors((prev) =>
          prev.map((v) =>
            v.id === id ? (data as unknown as VendorsWithSpecializations) : v,
          ),
        );
        return { success: true as const, data };
      } catch (err) {
        console.error("Unexpected error toggling vendor shop status:", err);
        setActionError({ message: "تعذر تحديث حالة المتجر" });
        setVendors((prev) =>
          prev.map((v) => (v.id === id ? { ...v, is_shop: !isShop } : v)),
        );
        return { success: false as const };
      }
    },
    [vendors],
  );

  const updateVendorLimitFlow = useCallback(
    async (
      id: string,
      payload: { price_limit: number | null; flow: 1 | 2 },
    ) => {
      setActionError(null);

      const prevVendor = vendors.find((v) => v.id === id);

      setVendors((prev) =>
        prev.map((v) =>
          v.id === id
            ? { ...v, price_limit: payload.price_limit, flow: payload.flow }
            : v,
        ),
      );

      try {
        const { data, error: updateError } = await supabase
          .from("vendors")
          .update({
            price_limit: payload.price_limit,
            flow: payload.flow,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select(VENDORS_SELECT)
          .single();

        if (updateError) {
          console.error("Error updating vendor limit/flow:", updateError);
          setActionError({ message: "تعذر حفظ التعديلات" });
          if (prevVendor) {
            setVendors((prev) =>
              prev.map((v) => (v.id === id ? prevVendor : v)),
            );
          }
          return { success: false as const, error: updateError };
        }

        setVendors((prev) =>
          prev.map((v) =>
            v.id === id ? (data as unknown as VendorsWithSpecializations) : v,
          ),
        );
        return { success: true as const, data };
      } catch (err) {
        console.error("Unexpected error updating vendor limit/flow:", err);
        setActionError({ message: "تعذر حفظ التعديلات" });
        if (prevVendor) {
          setVendors((prev) => prev.map((v) => (v.id === id ? prevVendor : v)));
        }
        return { success: false as const, error: err as PostgrestError };
      }
    },
    [vendors],
  );

  return {
    vendors,
    loading,
    error,
    actionError,
    clearActionError,
    refetch: fetchVendors,
    toggleVendorShop,
    updateVendorLimitFlow,
  };
}
