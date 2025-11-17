import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Clients } from "../types/global.type";
import { ClientFormValues } from "../types/schema/clients.shema";
import { supabaseAdmin } from "../lib/adminSupabase";

export function useClients() {
  const [clients, setClients] = useState<Clients[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from("clients").select("*");

    if (error) {
      console.error("error fetching clients", error);
      setError(error);
      setClients([]);
    } else {
      setClients((data ?? []) as Clients[]);
    }

    setLoading(false);
  }, []);

  const addClient = useCallback(async (payload: ClientFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const { data: userData, error: userError } =
        await supabaseAdmin.auth.admin.createUser({
          email: payload.email,
          password: payload.password,
          email_confirm: true,
          user_metadata: {
            role: "Client",
            firstName: payload.firstName,
            lastName: payload.lastName,
            phone: payload.phone,
            nationality: payload.nationality,
            roleId: "803c44ac-0af1-4586-81a2-67e1bc7eb7ef",
          },
        });

      if (userError) {
        console.error("Error creating auth user:", userError);
        setError(userError);
        setLoading(false);
        return { data: null, error: userError };
      }
      // Insert and return the inserted row
      const { data, error } = await supabase
        .from("clients")
        .insert({
          id: userData?.user?.id,
          first_name: payload.firstName,
          last_name: payload.lastName,
          email: payload.email,
          phone_number: payload.phone ?? "",
        })
        .select()
        .single();

      if (error) {
        console.error("error inserting client", error);
        setError(error);
        setLoading(false);
        return { error, data: null };
      }

      setLoading(false);
      return { data: data as Clients, error: null };
    } catch (err) {
      console.error("unexpected error inserting client", err);
      setError(err);
      setLoading(false);
      return { data: null, error: err };
    }
  }, []);

  const refresh = useCallback(() => fetchClients(), [fetchClients]);

  return { clients, loading, error, refresh, addClient };
}

export function useClient(id: string) {
  const [client, setClient] = useState<Clients | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchClients() {
      setLoading(true);
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("error fetching clients", error);
        setError(error);
      } else {
        setClient(data ?? null);
      }

      setLoading(false);
    }

    fetchClients();
  }, [id]); // runs once on mount
  return { client, loading, error };
}
