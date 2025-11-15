import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Clients } from "../types/global.type";

export function useClients() {
  const [clients, setClients] = useState<Clients[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchClients() {
      setLoading(true);
      const { data, error } = await supabase.from("clients").select("*");

      if (error) {
        console.error("error fetching clients", error);
        setError(error);
      } else {
        setClients(data ?? []);
      }

      setLoading(false);
    }

    fetchClients();
  }, []); // runs once on mount

  return { clients, loading, error };
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
