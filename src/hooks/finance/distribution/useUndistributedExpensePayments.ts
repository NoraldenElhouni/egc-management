import { useCallback, useEffect, useState } from "react";
import { PostgrestError, PostgrestResponse } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabaseClient";

// Supabase/PostgREST rejects `.in()` filters once the query string gets too
// long, which happens fast once there are a few hundred undistributed logs.
// Batch the lookups so each request stays well under that limit.
const IN_CHUNK_SIZE = 150;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function fetchInChunks<T>(
  ids: string[],
  fetchChunk: (chunkIds: string[]) => PromiseLike<PostgrestResponse<T>>,
): Promise<T[]> {
  if (ids.length === 0) return [];

  const results = await Promise.all(chunk(ids, IN_CHUNK_SIZE).map(fetchChunk));

  const rows: T[] = [];
  for (const { data, error } of results) {
    if (error) throw error;
    if (data) rows.push(...data);
  }
  return rows;
}

export interface UndistributedExpensePaymentRow {
  logId: string;
  paymentId: string | null;
  expenseId: string | null;
  projectId: string;
  projectName: string;
  projectSerial: number | null;
  percentageAmount: number;
  percentage: number;
  paymentAmount: number | null;
  paymentDate: string | null;
  paymentMethod: "cash" | "bank" | null;
  paymentSerial: number | null;
  expenseDescription: string | null;
  expenseSerial: number | null;
  expenseDate: string | null;
  expenseType: "material" | "labor" | "maps" | null;
  phase: "construction" | "finishing" | "initial" | null;
  currency: string;
  vendorName: string | null;
  contractorName: string | null;
  createdAt: string;
}

export function useUndistributedExpensePayments(projectId?: string) {
  const [rows, setRows] = useState<UndistributedExpensePaymentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let logsQuery = supabase
        .from("project_percentage_logs")
        .select(
          "id, amount, percentage, project_id, payment_id, expense_id, created_at",
        )
        .eq("type", "expense")
        .eq("distributed", false)
        .not("payment_id", "is", null);

      if (projectId) {
        logsQuery = logsQuery.eq("project_id", projectId);
      } else {
        logsQuery = logsQuery.not(
          "project_id",
          "in",
          `(5451aaae-c632-46f4-9913-8670cffcc8e7,e0a50575-bcc1-474a-98b8-8f57770a14fa,eed51009-4cfa-497c-87a1-cbf5a756f3da,f2d38514-32e0-4eeb-b6cd-fcdbed6a93ab)`,
        );
      }

      const { data: logsData, error: logsError } = await logsQuery.order(
        "created_at",
        { ascending: false },
      );

      if (logsError) throw logsError;

      const paymentIds = new Set<string>();
      const expenseIds = new Set<string>();
      const projectIds = new Set<string>();

      (logsData ?? []).forEach((l) => {
        if (l.payment_id) paymentIds.add(l.payment_id);
        if (l.expense_id) expenseIds.add(l.expense_id);
        projectIds.add(l.project_id);
      });

      const [paymentsData, expensesData, projectsData] = await Promise.all([
        fetchInChunks(Array.from(paymentIds), (ids) =>
          supabase
            .from("expense_payments")
            .select("id, amount, created_at, payment_method, serial_number")
            .in("id", ids),
        ),
        fetchInChunks(Array.from(expenseIds), (ids) =>
          supabase
            .from("project_expenses")
            .select(
              "id, description, serial_number, expense_date, expense_type, phase, currency, vendor_id, contractor_id",
            )
            .in("id", ids),
        ),
        fetchInChunks(Array.from(projectIds), (ids) =>
          supabase
            .from("projects")
            .select("id, name, serial_number")
            .in("id", ids),
        ),
      ]);

      const vendorIds = new Set<string>();
      const contractorIds = new Set<string>();
      expensesData.forEach((e) => {
        if (e.vendor_id) vendorIds.add(e.vendor_id);
        if (e.contractor_id) contractorIds.add(e.contractor_id);
      });

      const [vendorsData, contractorsData] = await Promise.all([
        fetchInChunks(Array.from(vendorIds), (ids) =>
          supabase.from("vendors").select("id, vendor_name").in("id", ids),
        ),
        fetchInChunks(Array.from(contractorIds), (ids) =>
          supabase
            .from("contractors")
            .select("id, first_name, last_name")
            .in("id", ids),
        ),
      ]);

      const paymentsMap = new Map(paymentsData.map((p) => [p.id, p]));
      const expensesMap = new Map(expensesData.map((e) => [e.id, e]));
      const projectsMap = new Map(projectsData.map((p) => [p.id, p]));
      const vendorsMap = new Map(vendorsData.map((v) => [v.id, v]));
      const contractorsMap = new Map(contractorsData.map((c) => [c.id, c]));

      const mapped: UndistributedExpensePaymentRow[] = (logsData ?? []).map(
        (l) => {
          const payment = l.payment_id
            ? paymentsMap.get(l.payment_id)
            : undefined;
          const expense = l.expense_id
            ? expensesMap.get(l.expense_id)
            : undefined;
          const project = projectsMap.get(l.project_id);
          const vendor = expense?.vendor_id
            ? vendorsMap.get(expense.vendor_id)
            : undefined;
          const contractor = expense?.contractor_id
            ? contractorsMap.get(expense.contractor_id)
            : undefined;

          return {
            logId: l.id,
            paymentId: l.payment_id,
            expenseId: l.expense_id,
            projectId: l.project_id,
            projectName: project?.name ?? "—",
            projectSerial: project?.serial_number ?? null,
            percentageAmount: l.amount,
            percentage: l.percentage,
            paymentAmount: payment?.amount ?? null,
            paymentDate: payment?.created_at ?? null,
            paymentMethod: payment?.payment_method ?? null,
            paymentSerial: payment?.serial_number ?? null,
            expenseDescription: expense?.description ?? null,
            expenseSerial: expense?.serial_number ?? null,
            expenseDate: expense?.expense_date ?? null,
            expenseType: expense?.expense_type ?? null,
            phase: expense?.phase ?? null,
            currency: expense?.currency ?? "LYD",
            vendorName: vendor?.vendor_name ?? null,
            contractorName: contractor
              ? `${contractor.first_name} ${contractor.last_name ?? ""}`.trim()
              : null,
            createdAt: l.created_at ?? "",
          };
        },
      );

      setRows(mapped);
    } catch (err) {
      console.error("Error fetching undistributed expense payments:", err);
      setError(err as PostgrestError);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { rows, loading, error, refetch: fetchData };
}
