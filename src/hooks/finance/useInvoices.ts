import { PostgrestError } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export type InvoiceType = {
  id: string;
  amount: number;
  created_at: string;
  invoice_no: number | null;
  payment_no: number | null;
  payment_method: string | null;
  project_expenses: {
    id: string;
    project_id: string;
    description: string | null;
    total_amount: number;
    amount_paid: number;
    status:
      | "pending"
      | "partially_paid"
      | "paid"
      | "overdue"
      | "cancelled"
      | "unpaid"
      | null;
  };
};

export function useInvoices(projectId: string) {
  const [invoices, setInvoices] = useState<InvoiceType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchInvoices() {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("expense_payments")
          .select(
            `
            id,
            amount,
            created_at,
            invoice_no,
            payment_no,
            payment_method,
            project_expenses (
              id,
              project_id,
              description,
              total_amount,
              amount_paid,
              status
            )
          `
          )
          .eq("project_expenses.project_id", projectId)
          .order("invoice_no", { ascending: true })
          .order("created_at", { ascending: true });
        if (error) throw error;

        setInvoices(data || []);
      } catch (err) {
        setError((err as PostgrestError) ?? null);
      } finally {
        setLoading(false);
      }
    }

    fetchInvoices();
  }, [projectId]);

  return { invoices, loading, error };
}
