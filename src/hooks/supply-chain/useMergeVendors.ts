import { PostgrestError } from "@supabase/supabase-js";
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export interface MergeVendorsInput {
  survivorId: string;
  loserId: string;
  vendorName: string;
  contactName: string | null;
  email: string | null;
  phoneNumber: string | null;
  altPhoneNumber: string | null;
  whatsappNumber: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  specializationId: string | null;
  bankId: string | null;
  bankNumber: string | null;
  bankHolderName: string | null;
}

export function useMergeVendors() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | Error | null>(null);

  async function mergeVendors(input: MergeVendorsInput) {
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error: rpcError } = await supabase.rpc("merge_vendors", {
      p_survivor_id: input.survivorId,
      p_loser_id: input.loserId,
      p_vendor_name: input.vendorName,
      p_created_by: user?.id ?? "",
      p_contact_name: input.contactName,
      p_email: input.email,
      p_phone_number: input.phoneNumber,
      p_alt_phone_number: input.altPhoneNumber,
      p_whatsapp_number: input.whatsappNumber,
      p_country: input.country,
      p_city: input.city,
      p_address: input.address,
      p_specialization_id: input.specializationId,
      p_bank_id: input.bankId,
      p_bank_number: input.bankNumber,
      p_bank_holder_name: input.bankHolderName,
    });

    if (rpcError) {
      setError(rpcError);
      setLoading(false);
      return { error: rpcError };
    }

    setLoading(false);
    return { error: null, result: data };
  }

  return { mergeVendors, loading, error };
}
