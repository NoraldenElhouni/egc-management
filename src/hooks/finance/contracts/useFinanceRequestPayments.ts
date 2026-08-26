import { useCallback, useEffect, useState } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabaseClient";
import { Database } from "../../../lib/supabase";
import { formatDate } from "../../../utils/helpper";
import { ContractorPaymentPdfItem } from "../payments/useContractorPaymentsPdf";

type RequestPaymentRow =
  Database["contracts"]["Tables"]["request_payments"]["Row"];

type ContractorSummary = {
  id: string;
  first_name: string;
  last_name: string | null;
  whatsapp_number: string | null;
};

type ProjectSummary = {
  id: string;
  name: string;
};

type RequesterSummary = {
  id: string;
  first_name: string;
  last_name: string | null;
};

type ExpenseSummary = {
  id: string;
  description: string | null;
  serial_number: number | null;
};

export interface FinanceRequestPayment extends RequestPaymentRow {
  contractor: ContractorSummary | null;
  project: ProjectSummary | null;
  requester: RequesterSummary | null;
  expense: ExpenseSummary | null;
  finance_entered: boolean;
  finance_entered_at: string | null;
  finance_entered_by: string | null;
}

export function requestPaymentToPdfItem(
  payment: FinanceRequestPayment,
): ContractorPaymentPdfItem {
  return {
    payments_number: `#${String(payment.serial_number ?? "").padStart(3, "0")}`,
    project_name: payment.project?.name ?? "",
    contractor_name: payment.contractor
      ? `${payment.contractor.first_name} ${payment.contractor.last_name ?? ""}`.trim()
      : "",
    prev_amount: payment.prev_amount,
    amount: payment.amount,
    penalty_amount: payment.penalty_amount,
    penalty_reason: payment.penalty_reason,
    payments_reason: payment.description,
    grand_total: payment.grand_total ?? 0,
    currency: payment.currency,
    method:
      payment.payment_method === "cash"
        ? "نقداً"
        : payment.payment_method === "bank"
          ? "بنك"
          : "—",
    created_at: formatDate(payment.created_at),
    created_by_name: payment.requester
      ? `${payment.requester.first_name} ${payment.requester.last_name ?? ""}`.trim()
      : "",
    expense_reference: payment.expense
      ? [payment.expense.serial_number, payment.expense.description]
          .filter((part) => part !== null && part !== "")
          .join(" - ") || null
      : null,
    bank_name: payment.bank_name,
    bank_number: payment.bank_number,
    bank_holder_name: payment.bank_holder_name,
    whatsapp_number: payment.contractor?.whatsapp_number ?? null,
  };
}

export function useFinanceRequestPayments() {
  const [payments, setPayments] = useState<FinanceRequestPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: paymentsData, error: paymentsError } = await supabase
        .schema("contracts")
        .from("request_payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (paymentsError) throw paymentsError;

      const contractorIds = new Set<string>();
      const projectIds = new Set<string>();
      const requesterIds = new Set<string>();
      const expenseIds = new Set<string>();

      (paymentsData ?? []).forEach((p) => {
        contractorIds.add(p.contractor_id);
        projectIds.add(p.project_id);
        requesterIds.add(p.requested_by);
        if (p.expense_id) expenseIds.add(p.expense_id);
      });

      const [
        { data: contractorsData, error: contractorsError },
        { data: projectsData, error: projectsError },
        { data: requestersData, error: requestersError },
        { data: expensesData, error: expensesError },
      ] = await Promise.all([
        contractorIds.size
          ? supabase
              .from("contractors")
              .select("id, first_name, last_name, whatsapp_number")
              .in("id", Array.from(contractorIds))
          : Promise.resolve({ data: [], error: null }),
        projectIds.size
          ? supabase
              .from("projects")
              .select("id, name")
              .in("id", Array.from(projectIds))
          : Promise.resolve({ data: [], error: null }),
        requesterIds.size
          ? supabase
              .from("employees")
              .select("id, first_name, last_name")
              .in("id", Array.from(requesterIds))
          : Promise.resolve({ data: [], error: null }),
        expenseIds.size
          ? supabase
              .from("project_expenses")
              .select("id, description, serial_number")
              .in("id", Array.from(expenseIds))
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (contractorsError) throw contractorsError;
      if (projectsError) throw projectsError;
      if (requestersError) throw requestersError;
      if (expensesError) throw expensesError;

      const contractorsMap = new Map(
        (contractorsData ?? []).map((c) => [c.id, c]),
      );
      const projectsMap = new Map((projectsData ?? []).map((p) => [p.id, p]));
      const requestersMap = new Map(
        (requestersData ?? []).map((r) => [r.id, r]),
      );
      const expensesMap = new Map((expensesData ?? []).map((e) => [e.id, e]));

      setPayments(
        (paymentsData ?? []).map((p) => ({
          ...p,
          contractor: contractorsMap.get(p.contractor_id) ?? null,
          project: projectsMap.get(p.project_id) ?? null,
          requester: requestersMap.get(p.requested_by) ?? null,
          expense: p.expense_id
            ? (expensesMap.get(p.expense_id) ?? null)
            : null,
        })),
      );
    } catch (err) {
      console.error("Error fetching finance contract request payments:", err);
      setError(err as PostgrestError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const markRequestPaymentsEntered = useCallback(
    async (requestPaymentIds: string[], userId?: string | null) => {
      if (requestPaymentIds.length === 0) return { error: null };

      const { error: updateError } = await supabase
        .schema("contracts")
        .from("request_payments")
        .update({
          finance_entered: true,
          finance_entered_at: new Date().toISOString(),
          finance_entered_by: userId ?? null,
        })
        .in("id", requestPaymentIds);

      if (updateError) {
        console.error("Error marking request payments as entered:", updateError);
        return { error: updateError };
      }

      await fetchData();
      return { error: null };
    },
    [fetchData],
  );

  return {
    payments,
    loading,
    error,
    refetch: fetchData,
    markRequestPaymentsEntered,
  };
}
