import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

// ─── Types ────────────────────────────────────────────────────────────────────

interface IncomeItem {
  name: string;
  serial_number: string;
  description: string;
  method: string;
  date: string;
  amount: number;
}

interface IncomesListReportPayload {
  project_name: string;
  report_date: string;
  incomes: IncomeItem[];
  total_amount: number;
}

interface Props {
  projectId: string;
}

// ─── Data Fetching ────────────────────────────────────────────────────────────

async function fetchPayload(
  projectId: string,
): Promise<IncomesListReportPayload> {
  // 1. Fetch project name
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("name")
    .eq("id", projectId)
    .single();

  if (projectError) throw new Error(projectError.message);

  // 2. Fetch incomes for this project
  const { data: incomes, error: incomesError } = await supabase
    .from("project_incomes")
    .select(
      "serial_number, amount, payment_method, fund, description, client_name, income_date, currency",
    )
    .eq("project_id", projectId)
    .order("income_date", { ascending: true });

  if (incomesError) throw new Error(incomesError.message);

  const incomeItems: IncomeItem[] = (incomes ?? []).map((i) => ({
    name: i.client_name ?? i.fund ?? "—",
    serial_number: i.serial_number?.toString() ?? "—",
    description: i.description ?? "",
    method: i.payment_method ?? "",
    date: i.income_date,
    amount: Number(i.amount ?? 0),
  }));

  const total_amount =
    Math.round(incomeItems.reduce((sum, i) => sum + i.amount, 0) * 100) / 100;

  return {
    project_name: project.name,
    report_date: new Date().toLocaleDateString("ar-LY"),
    incomes: incomeItems,
    total_amount,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

const IncomesListPdfButton = ({ projectId }: Props) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchPayload(projectId);

      const res = await fetch(
        "http://102.203.200.52/api/v1/egc/management/incomes-list/pdf",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
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
        {loading ? "جاري الإنشاء..." : "طباعة كشف الإيرادات"}
      </button>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default IncomesListPdfButton;
