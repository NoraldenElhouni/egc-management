import { PostgrestError } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import { PaymentMethod, Specializations } from "../../../types/global.type";
import { supabase } from "../../../lib/supabaseClient";
import { contractorWithSpecializations } from "../../../types/extended.type";
import { fetchByIds } from "./crossSchemaLookup";

interface ContractorNameRow {
  id: string;
  first_name: string;
  last_name: string | null;
}

export interface ContractListRow {
  id: string;
  project_id: string;
  round_id: string;
  quote_id: string;
  contractor_id: string;
  status: "draft" | "active" | "completed" | "cancelled";
  total_amount: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  rounds: { title: string } | null;
  contractor: ContractorNameRow | null;
}

export interface ContractItemRow {
  id: string;
  contract_id: string;
  boq_item_id: string | null;
  work_id: string | null;
  name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_price: number | null;
  sort_order: number;
}

export interface ContractMilestoneRow {
  id: string;
  contract_id: string;
  title: string;
  description: string | null;
  amount: number;
  percentage: number;
  order_index: number;
  due_date: string | null;
  status: "pending" | "in_progress" | "done";
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
}

export interface ContractPaymentRow {
  id: string;
  project_id: string;
  contract_id: string;
  contractor_id: string;
  requested_by: string;
  amount: number;
  penalty_amount: number;
  grand_total: number | null;
  description: string | null;
  decline_reason: string | null;
  expense_id: string | null;
  payment_method: PaymentMethod | null;
  status: "pending" | "approved" | "rejected" | "paid";
  serial_number: number | null;
  paid_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  payment_milestones: {
    id: string;
    amount: number;
    milestone_id: string;
    milestones: { title: string } | null;
  }[];
  payment_penalties: {
    id: string;
    amount: number;
    reason: string;
    description: string | null;
    image_path: string | null;
    milestone_id: string | null;
  }[];
}

export interface ContractDetail {
  id: string;
  project_id: string;
  round_id: string;
  quote_id: string;
  contractor_id: string;
  status: "draft" | "active" | "completed" | "cancelled";
  total_amount: number;
  advance_percentage: number;
  insurance_percentage: number;
  delay_penalty_per_day: number | null;
  duration_days: number | null;
  start_date: string | null;
  end_date: string | null;
  terms: string | null;
  created_at: string;
  updated_at: string;
  project: { name: string } | null;
  round: { title: string; specialization: { name: string } | null } | null;
  contractor: {
    id: string;
    first_name: string;
    last_name: string | null;
    phone_number: string | null;
    email: string | null;
  } | null;
  contract_items: ContractItemRow[];
  milestones: ContractMilestoneRow[];
  request_payments: ContractPaymentRow[];
}

export function useContracts(projectId: string) {
  const [contracts, setContracts] = useState<ContractListRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    if (!projectId) return;
    async function fetchContracts() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .schema("contracts")
          .from("contracts")
          .select("*, rounds(title)")
          .eq("project_id", projectId);

        if (error) {
          console.error("error fetching contracts", error);
          setError(error);
          setLoading(false);
          return;
        }

        const contractorsById = await fetchByIds<ContractorNameRow>(
          "contractors",
          "id, first_name, last_name",
          (data ?? []).map((c) => c.contractor_id),
        );

        setContracts(
          (data ?? []).map((c) => ({
            ...c,
            contractor: contractorsById[c.contractor_id] ?? null,
          })),
        );
      } catch (err) {
        console.error("unexpected error fetching contracts", err);
        setError(err as PostgrestError);
      }
      setLoading(false);
    }
    fetchContracts();
  }, [projectId]);

  return { contracts, loading, error };
}

// One contract count per project, for the projects list page — `contracts`
// is a different schema than `public.projects`, so this can't be embedded
// into the projects query and has to be fetched/counted separately.
export function useContractCountsByProject(enabled: boolean) {
  const [countsByProject, setCountsByProject] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    if (!enabled) return;
    async function fetchCounts() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .schema("contracts")
          .from("contracts")
          .select("project_id");

        if (error) {
          setError(error);
          setLoading(false);
          return;
        }

        const counts = (data ?? []).reduce<Record<string, number>>(
          (acc, row) => {
            acc[row.project_id] = (acc[row.project_id] ?? 0) + 1;
            return acc;
          },
          {},
        );
        setCountsByProject(counts);
      } catch (err) {
        setError(err as PostgrestError);
      }
      setLoading(false);
    }
    fetchCounts();
  }, [enabled]);

  return { countsByProject, loading, error };
}

export function useSpecializations() {
  const [specializations, setSpecializations] = useState<Specializations[]>(
    [],
  );
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

export function useContractors(enabled: boolean) {
  const [contractors, setContractors] = useState<
    contractorWithSpecializations[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    if (!enabled) return;

    async function fetchContractors() {
      setLoading(true);

      const { data, error } = await supabase
        .from("contractors")
        .select(
          `*,specializations(id,name,role_id),users(user_specializations(*, specializations(*)))`,
        );
      if (error) setError(error);
      else setContractors(data ?? []);

      setLoading(false);
    }

    fetchContractors();
  }, [enabled]);

  return { contractors, loading, error };
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
          .schema("contracts")
          .from("contracts")
          .select(
            `*,
            rounds(title, specialization_id),
            contract_items(*),
            milestones(*),
            request_payments(
              *,
              payment_milestones(id, amount, milestone_id, milestones(title)),
              payment_penalties(id, amount, reason, description, image_path, milestone_id)
            )`,
          )
          .eq("id", contractId)
          .single();

        if (error) {
          setError(error);
          setLoading(false);
          return;
        }

        const row = data as unknown as {
          project_id: string;
          contractor_id: string;
          rounds: { title: string; specialization_id: string | null } | null;
        } & Record<string, unknown>;

        const [projectsById, contractorsById, specsById] = await Promise.all([
          fetchByIds<{ id: string; name: string }>(
            "projects",
            "id, name",
            [row.project_id],
          ),
          fetchByIds<{
            id: string;
            first_name: string;
            last_name: string | null;
            phone_number: string | null;
            email: string | null;
          }>(
            "contractors",
            "id, first_name, last_name, phone_number, email",
            [row.contractor_id],
          ),
          fetchByIds<{ id: string; name: string }>(
            "specializations",
            "id, name",
            [row.rounds?.specialization_id],
          ),
        ]);

        setContract({
          ...row,
          project: projectsById[row.project_id] ?? null,
          contractor: contractorsById[row.contractor_id] ?? null,
          round: row.rounds
            ? {
                title: row.rounds.title,
                specialization: row.rounds.specialization_id
                  ? (specsById[row.rounds.specialization_id] ?? null)
                  : null,
              }
            : null,
        } as unknown as ContractDetail);
      } catch (err) {
        setError(err as PostgrestError);
      }
      setLoading(false);
    }
    fetch();
  }, [contractId]);

  const totalPaid = useMemo(
    () =>
      contract?.request_payments
        .filter((p) => p.status === "approved" || p.status === "paid")
        .reduce((sum, p) => sum + (p.grand_total ?? p.amount), 0) ?? 0,
    [contract],
  );

  const totalRemaining = useMemo(
    () => (contract ? contract.total_amount - totalPaid : 0),
    [contract, totalPaid],
  );

  const completedMilestones = useMemo(
    () => contract?.milestones.filter((m) => m.status === "done").length ?? 0,
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
