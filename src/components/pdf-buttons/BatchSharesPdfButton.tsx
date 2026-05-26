import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { DistributionBatch } from "../company/distribution/useDistributionBatches";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShareHolder {
  name: string;
  amount: number;
  bank_account_number: string | null;
  bank_name: string | null;
}
type EarningsEntry = {
  name: string;
  amount: number;
  bank_account_number: string | null;
  bank_name: string | null;
};

interface SharesReportPayload {
  report_date: string;
  total_amount: number;
  shareholders: ShareHolder[];
}

interface Props {
  batch: DistributionBatch;
}

// ─── Data Fetching ────────────────────────────────────────────────────────────

async function fetchBatchPayload(
  batch: DistributionBatch,
): Promise<SharesReportPayload> {
  const periodIds = batch.periods
    .filter((p) => p.status !== "reversed")
    .map((p) => p.id);

  if (periodIds.length === 0) {
    return {
      report_date: batch.date,
      total_amount: 0,
      shareholders: [],
    };
  }

  // Fetch all employee items for every period in the batch, joining employee names
  const { data, error } = await supabase
    .from("project_percentage_period_items")
    .select(
      `period_id, user_id, item_type, total,
       employee:employees!project_percentage_period_items_user_id_fkey(
         first_name, last_name, bank_account_number, bank_name
       )`,
    )
    .in("period_id", periodIds)
    .eq("item_type", "employee");

  if (error) throw new Error(error.message);

  // Aggregate total per employee across all periods in this batch
  const earningsMap = new Map<string, EarningsEntry>();

  for (const item of data ?? []) {
    if (!item.user_id) continue;

    const amount = Number(item.total ?? 0);
    if (amount <= 0) continue;

    const emp = item.employee as {
      first_name: string;
      last_name: string | null;
      bank_account_number: string | null;
      bank_name: string | null;
    } | null;

    const name = emp
      ? `${emp.first_name} ${emp.last_name ?? ""}`.trim()
      : item.user_id;

    const prev = earningsMap.get(item.user_id) ?? {
      name,
      amount: 0,
      bank_account_number: emp?.bank_account_number ?? null,
      bank_name: emp?.bank_name ?? null,
    };

    prev.amount += amount;
    earningsMap.set(item.user_id, prev);
  }

  const shareholders: ShareHolder[] = Array.from(earningsMap.values()).map(
    (e) => ({
      name: e.name,
      amount: Math.round(e.amount * 100) / 100,
      bank_name: e.bank_name,
      bank_account_number: e.bank_account_number,
    }),
  );

  const total = shareholders.reduce((sum, s) => sum + s.amount, 0);

  return {
    report_date: batch.date,
    total_amount: Math.round(total * 100) / 100,
    shareholders,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

const BatchSharesPdfButton = ({ batch }: Props) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchBatchPayload(batch);

      const res = await fetch(
        "http://102.203.200.52/api/v1/egc/management/shares/pdf",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `shares-${payload.report_date}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      console.error("Error generating PDF:", err);
      setError(
        err instanceof Error
          ? "فشل إنشاء التقرير: " + err.message
          : "فشل إنشاء التقرير: خطأ غير معروف",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className={[
          "px-4 py-2 rounded-md text-white text-sm font-medium flex items-center gap-2",
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-700",
        ].join(" ")}
      >
        <span>🖨️</span>
        {loading ? "جاري الإنشاء..." : "طباعة كشف الحصص"}
      </button>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default BatchSharesPdfButton;
