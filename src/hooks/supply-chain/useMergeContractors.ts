import { PostgrestError } from "@supabase/supabase-js";
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export interface MergeContractorsInput {
  survivorId: string;
  loserId: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
  whatsappNumber: string | null;
  specializationId: string | null;
  bankId: string | null;
  bankNumber: string | null;
  bankHolderName: string | null;
}

export function useMergeContractors() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | Error | null>(null);

  async function mergeContractors(input: MergeContractorsInput) {
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error: rpcError } = await supabase.rpc(
      "merge_contractors",
      {
        p_survivor_id: input.survivorId,
        p_loser_id: input.loserId,
        p_first_name: input.firstName,
        p_last_name: input.lastName,
        p_email: input.email,
        p_phone_number: input.phoneNumber,
        p_whatsapp_number: input.whatsappNumber,
        p_specialization_id: input.specializationId,
        p_bank_id: input.bankId,
        p_bank_number: input.bankNumber,
        p_bank_holder_name: input.bankHolderName,
        p_created_by: user?.id ?? "",
      },
    );

    if (rpcError) {
      setError(rpcError);
      setLoading(false);
      return { error: rpcError };
    }

    setLoading(false);
    return { error: null, result: data };
  }

  return { mergeContractors, loading, error };
}
