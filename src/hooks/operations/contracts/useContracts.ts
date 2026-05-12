import { PostgrestError } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import {
  Contractors,
  Contracts,
  Specializations,
} from "../../../types/global.type";
import { supabase } from "../../../lib/supabaseClient";
import { RequestForm } from "../../../types/schema/contracts.schema";

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

export interface ContractMilestone {
  id: string;
  contract_id: string;
  title: string;
  description: string | null;
  amount: number;
  due_date: string | null;
  status: "pending" | "in_progress" | "completed" | "approved";
  order_index: number;
  completed_at: string | null;
  created_at: string;
}

export interface PaymentRequest {
  id: string;
  amount: number;
  description: string | null;
  status: "pending" | "approved" | "declined" | "paid";
  payment_method: string | null;
  created_at: string;
  contract_milestones: { title: string };
  employees: { first_name: string; last_name: string | null };
}

export interface ContractDetail {
  id: string;
  total_amount: number;
  days_allocated: number;
  start_date: string | null;
  end_date: string | null;
  status: "active" | "completed" | "on_hold" | "terminated";
  notes: string | null;
  created_at: string;
  projects: { name: string; code: string };
  work_requests: {
    id: string;
    title: string;
    specializations: { name: string };
  };
  contractors: {
    id: string;
    first_name: string;
    last_name: string | null;
    phone_number: string | null;
    email: string | null;
  };
  employees: { first_name: string; last_name: string | null };
  contract_milestones: ContractMilestone[];
  payment_requests: PaymentRequest[];
}

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
          .select("*")
          .eq("role_id", "20606a44-1f4b-4e0a-af58-abc553b70bc0");

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
        status: "open",
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

export function useContractDetails(contractId: string) {
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    if (!contractId) return;
    async function fetch() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("contracts")
          .select(
            `*,
            projects(name, code),
            work_requests(id, title, specializations(name)),
            contractors(id, first_name, last_name, phone_number, email),
            employees!contracts_created_by_fkey(first_name, last_name),
            contract_milestones(*),
            payment_requests(
              *,
              contract_milestones(title),
              employees!payment_requests_requested_by_fkey(first_name, last_name)
            )`,
          )
          .eq("id", contractId)
          .single();

        if (error) setError(error);
        else setContract(data);
      } catch (err) {
        setError(err as PostgrestError);
      }
      setLoading(false);
    }
    fetch();
  }, [contractId]);

  const totalPaid = useMemo(
    () =>
      contract?.payment_requests
        .filter((p) => p.status === "approved" || p.status === "paid")
        .reduce((sum, p) => sum + p.amount, 0) ?? 0,
    [contract],
  );

  const totalRemaining = useMemo(
    () => (contract ? contract.total_amount - totalPaid : 0),
    [contract, totalPaid],
  );

  const completedMilestones = useMemo(
    () =>
      contract?.contract_milestones.filter((m) => m.status === "completed")
        .length ?? 0,
    [contract],
  );

  const daysRemaining = useMemo(() => {
    if (!contract?.end_date) return null;
    const diff = Math.ceil(
      (new Date(contract.end_date).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24),
    );
    return diff > 0 ? diff : 0;
  }, [contract]);

  return {
    contract,
    loading,
    error,
    totalPaid,
    totalRemaining,
    completedMilestones,
    daysRemaining,
  };
}
