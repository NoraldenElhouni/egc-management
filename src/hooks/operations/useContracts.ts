import { PostgrestError } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import {
  Contractors,
  Contracts,
  Specializations,
  WorkRequests,
} from "../../types/global.type";
import { supabase } from "../../lib/supabaseClient";
import { RequestForm } from "../../types/schema/contracts.schema";

export type Service = {
  id: string;
  name: string;
  unit: string | null;
  category_id: string | null;
  specialization_id: string | null;
  specialization_categories: {
    // ✅ joined from schema
    name: string;
  } | null;
};

export function useContracts(projectId: string) {
  const [contracts, setContracts] = useState<Contracts[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchContracts() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("contracts")
          .select("*")
          .eq("project_id", projectId);

        if (error) {
          console.error("error fetching contracts", error);
          setError(error);
        } else {
          setContracts(data ?? []);
        }
      } catch (err) {
        console.error("unexpected error fetching contracts", err);
        setError(err as PostgrestError);
      }
      setLoading(false);
    }
    fetchContracts();
  }, []);

  return { contracts, loading, error };
}

export function useWorkRequests(projectId: string) {
  const [workRequests, setWorkRequests] = useState<WorkRequests[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchWorkRequests() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("work_requests")
          .select("*")
          .eq("project_id", projectId);

        if (error) {
          console.error("error fetching work requests", error);
          setError(error);
        } else {
          setWorkRequests(data ?? []);
        }
      } catch (err) {
        console.error("unexpected error fetching work requests", err);
        setError(err as PostgrestError);
      }
      setLoading(false);
    }
    fetchWorkRequests();
  }, [projectId]); // ✅ re-runs when projectId changes

  return { workRequests, loading, error };
}

export function useSpecializations() {
  const [specializations, setSpecializations] = useState<Specializations[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchspecializations() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("specializations")
          .select("*");

        if (error) {
          console.error("error fetching specializations", error);
          setError(error);
        } else {
          setSpecializations(data ?? []);
        }
      } catch (err) {
        console.error("unexpected error fetching specializations", err);
        setError(err as PostgrestError);
      }
      setLoading(false);
    }
    fetchspecializations();
  }, []);

  return { specializations, loading, error };
}

export function useServicesBySpecialization(specId: string) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    if (!specId) return; // 👈 skip if no spec selected yet

    async function fetchServices() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("services")
          .select(
            `
            id, name, unit, category_id, specialization_id,
            specialization_categories ( name )
          `,
          )
          .eq("specialization_id", specId);

        if (error) {
          setError(error);
        } else {
          setServices(data ?? []);
        }
      } catch (err) {
        setError(err as PostgrestError);
      }
      setLoading(false);
    }

    fetchServices();
  }, [specId]); // ✅ re-runs whenever specId changes

  return { services, loading, error };
}

export function useContractors(enabled: boolean) {
  const [contractors, setContractors] = useState<Contractors[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    if (!enabled) return; // 👈 skip fetch if mode is not direct

    async function fetchContractors() {
      setLoading(true);

      const { data, error } = await supabase.from("contractors").select("*");

      if (error) setError(error);
      else setContractors(data ?? []);

      setLoading(false);
    }

    fetchContractors();
  }, [enabled]); // 👈 re-runs when enabled changes

  return { contractors, loading, error };
}

export function useCreateRequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  async function createRequest(values: RequestForm, projectId: string) {
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Step 1: insert the work_request
    const { data: request, error: requestError } = await supabase
      .from("work_requests")
      .insert({
        project_id: projectId,
        specialization_id: values.specialization_id,
        title: values.title,
        description: values.description,
        bid_deadline: values.bid_deadline,
        mode: values.bid_mode,
        created_by: user?.id ?? "",
        work_start_at: values.work_start_at,
        direct_contractor_id:
          values.bid_mode === "direct"
            ? values.direct_contractor_id // 👈 only sent if direct
            : null,
      })
      .select("id")
      .single();

    if (requestError) {
      setError(requestError);
      setLoading(false);
      return { error: requestError };
    }

    // Step 2: insert all items using the returned request id
    const { error: itemsError } = await supabase
      .from("work_request_items")
      .insert(
        values.items.map((item) => ({
          request_id: request.id,
          service_id: item.id,
          quantity: item.quantity,
          unit: item.unit,
        })),
      );

    if (itemsError) {
      setError(itemsError);
      setLoading(false);
      return { error: itemsError };
    }

    setLoading(false);
    return { error: null };
  }

  return { createRequest, loading, error };
}
