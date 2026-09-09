import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Clients } from "../types/global.type";
import { ClientFormValues } from "../types/schema/clients.schema";
import { supabaseAdmin } from "../lib/adminSupabase";
import { PostgrestError } from "@supabase/supabase-js";

// The Client role. Was written out as a bare uuid in two places; one
// constant so they cannot drift apart.
const CLIENT_ROLE_ID = "803c44ac-0af1-4586-81a2-67e1bc7eb7ef";

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
        const { data: userData, error: userError } =
          await supabaseAdmin.auth.admin.createUser({
            email: payload.email,
            password: payload.password,
            email_confirm: true,
            user_metadata: {
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
          });

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
        // It is written with supabaseAdmin, like the auth user above,
        // rather than the anon client used for the rows below.
        if (userId) {
          const { error: userRoleError } = await supabaseAdmin
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
      const { data, error } = await supabase
        .from("clients")
        .insert([
          {
            first_name: payload.firstName,
            last_name: payload.lastName,
            email: payload.email ?? undefined,
            phone_number: payload.phone ?? "",
            code: `${role.code}-${role.number}`,
            user_id: userId,
          },
        ])
        .select()
        .single();

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
      setError(err);
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
