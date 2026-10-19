import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Clients } from "../types/global.type";
import { ClientFormValues } from "../types/schema/clients.schema";
import { adminCreateUser } from "../lib/adminApi";
import { PostgrestError } from "@supabase/supabase-js";

// The Client role. Was written out as a bare uuid in two places; one
// constant so they cannot drift apart.
const CLIENT_ROLE_ID = "803c44ac-0af1-4586-81a2-67e1bc7eb7ef";

export function useClients() {
  const [clients, setClients] = useState<Clients[]>([]);
  const [loading, setLoading] = useState(false);
  // PostgrestError / AuthError / Error: the screens only read .message
  const [error, setError] = useState<{ message: string } | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from("clients").select("*");

    if (error) {
      console.error("error fetching clients", error);
      setError(error);
      setClients([]);
    } else {
      setClients(data);
    }

    setLoading(false);
  }, []);

  const addClient = useCallback(async (payload: ClientFormValues) => {
    setLoading(true);
    setError(null);

    try {
      let userId: string | null = null;
      const hasAuth = !!payload.email && !!payload.password;

      if (hasAuth) {
        // Created by the admin-users Edge Function, which checks the
        // manage_clients permission and forces roleId / partyType.
        const { data: userData, error: userError } = await adminCreateUser(
          "client",
          {
            email: payload.email as string,
            password: payload.password as string,
            userMetadata: {
              role: "Client",
              firstName: payload.firstName,
              lastName: payload.lastName,
              nationality: payload.nationality,
              roleId: CLIENT_ROLE_ID,
              // handle_new_user() sets users.party_type from this. Phase 1
              // made the column NOT NULL with no default, so without it
              // the insert fails — see phase8-create-employee.sql.
              partyType: "client",
            },
          },
        );

        if (userError) {
          console.error("Error creating auth user:", userError);
          setError(userError);
          setLoading(false);
          return { data: null, error: userError };
        }

        userId = userData?.user?.id ?? null;

        // ── the missing write ──────────────────────────────────────────
        // This flow created an auth user and never inserted user_roles.
        // Every other creation path in the app does. That single omission
        // is why client accounts hold a users.role_id and resolve to no
        // role at all — phase2-resolver.sql DECISION 7 reads user_roles,
        // not role_id — and it is a named part of Phase 0's 38-account
        // divergence.
        //
        // Written with the signed-in client, like the rows below.
        if (userId) {
          const { error: userRoleError } = await supabase
            .from("user_roles")
            .upsert(
              { user_id: userId, role_id: CLIENT_ROLE_ID },
              { onConflict: "user_id,role_id", ignoreDuplicates: true },
            );

          if (userRoleError) {
            console.error("Error assigning client role:", userRoleError);
            setError(userRoleError);
            setLoading(false);
            return { data: null, error: userRoleError };
          }
        }
      }

      // -----------------------------
      // 2. GET ROLE
      // -----------------------------
      const { data: role, error: roleError } = await supabase
        .from("roles")
        .select("*")
        .eq("id", CLIENT_ROLE_ID)
        .single();

      if (roleError) {
        console.error("error fetching role", roleError);
        setError(roleError);
        setLoading(false);
        return { data: null, error: roleError };
      }

      // -----------------------------
      // 3. CREATE CLIENT (ALWAYS)
      // -----------------------------
      const clientRow = {
        first_name: payload.firstName,
        last_name: payload.lastName,
        email: payload.email ?? undefined,
        phone_number: payload.phone ?? "",
        code: `${role.code}-${role.number}`,
        user_id: userId,
      };

      // For a client WITH a login, the database trigger handle_new_user() has
      // already created the clients row (it does so for every client login).
      // Update that row with the code instead of inserting a second one.
      let existingClientId: string | null = null;
      if (userId) {
        const { data: existing, error: existingError } = await supabase
          .from("clients")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();
        if (existingError) {
          console.error("error looking up the client row", existingError);
          setError(existingError);
          setLoading(false);
          return { data: null, error: existingError };
        }
        existingClientId = existing?.id ?? null;
      }

      const { data, error } = existingClientId
        ? await supabase
            .from("clients")
            .update(clientRow)
            .eq("id", existingClientId)
            .select()
            .single()
        : await supabase.from("clients").insert([clientRow]).select().single();

      if (error) {
        console.error("error inserting client", error);
        setError(error);
        setLoading(false);
        return { data: null, error };
      }

      // -----------------------------
      // 4. UPDATE ROLE NUMBER ONLY IF USER CREATED
      // -----------------------------
      const { error: numberUpdateError } = await supabase
        .from("roles")
        .update({ number: role.number + 1 })
        .eq("id", role.id);

      if (numberUpdateError) {
        console.error("error updating role number", numberUpdateError);
        setError(numberUpdateError);
        setLoading(false);
        return { data: null, error: numberUpdateError };
      }

      setLoading(false);
      return { data: data as Clients, error: null };
    } catch (err) {
      console.error("unexpected error inserting client", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
      return { data: null, error: err };
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const refresh = useCallback(() => fetchClients(), [fetchClients]);

  return { clients, loading, error, refresh, addClient };
}

export function useClient(id: string) {
  const [client, setClient] = useState<Clients | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError>();

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
