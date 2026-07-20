import { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

type UpdateVendorPayload = {
  price_limit: number | null;
  flow: 1 | 2;
};

export const useEditVendorLimitFlow = (vendorId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateVendor = async (payload: UpdateVendorPayload) => {
    setIsLoading(true);
    setError(null);

    const { data, error: supabaseError } = await supabase
      .from("vendors")
      .update({
        price_limit: payload.price_limit,
        flow: payload.flow,
        updated_at: new Date().toISOString(),
      })
      .eq("id", vendorId)
      .select()
      .single();

    setIsLoading(false);

    if (supabaseError) {
      setError(supabaseError.message);
      return { success: false as const, error: supabaseError.message };
    }

    return { success: true as const, data };
  };

  return { updateVendor, isLoading, error };
};
