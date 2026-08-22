import { useState } from "react";
import Button from "./ui/Button";
import { ProjectWithDetailsForBook } from "../types/projects.type";
import ErrorPage from "./ui/errorPage";
import { fetchManagementApi } from "../lib/managementApiClient";
import { useAuth } from "../hooks/useAuth";

interface InvoiceButtonSummedProps {
  project: ProjectWithDetailsForBook | null;
}

export default function InvoiceButtonSummed({
  project,
}: InvoiceButtonSummedProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  if (user?.role !== "Manager") return null;

  if (!project || project === null) return <ErrorPage />;

  const r = (n: number) => Math.round(n * 100) / 100;

  // Merges rows that share the same expense name, summing their total_price.
  // No serial_number/contractor/date is kept — just the name and the total,
  // so two expenses named "EX1" become a single "EX1" line with the combined
  // amount, regardless of who they were paid to.
  function sumByName(
    rows: { name: string | null; total_price: number }[],
  ): { name: string | null; total_price: number }[] {
    const merged = new Map<string, { name: string | null; total_price: number }>();

    for (const row of rows) {
      const key = row.name ?? "";
      const existing = merged.get(key);
      if (existing) {
        existing.total_price = r(existing.total_price + row.total_price);
      } else {
        merged.set(key, { ...row });
      }
    }

    return Array.from(merged.values()).sort(
      (a, b) => b.total_price - a.total_price,
    );
  }

  const formatPayload = (project: ProjectWithDetailsForBook) => {
    const lydExpenses = project.project_expenses.filter(
      (e) => e.currency === "LYD" && e.deleted_at === null,
    );

    const totalMetrials = r(
      lydExpenses
        .filter((e) => e.expense_type === "material")
        .reduce((acc, e) => acc + (e.total_amount ?? 0), 0),
    );

    const totalLabors = r(
      lydExpenses
        .filter((e) => e.expense_type === "labor")
        .reduce((acc, e) => acc + (e.total_amount ?? 0), 0),
    );

    const totalNotPaid = r(
      lydExpenses.reduce(
        (acc, e) => acc + ((e.total_amount ?? 0) - (e.amount_paid ?? 0)),
        0,
      ),
    );

    const totalRefund = r(
      project.project_refund
        .filter((rf) => rf.currency === "LYD")
        .reduce((acc, rf) => acc + (rf.amount ?? 0), 0),
    );

    const lydBalances = project.project_balances.filter(
      (a) => a.currency === "LYD",
    );

    const totalCompanyPercentage = r(
      lydBalances.reduce((acc, a) => acc + (a.total_percentage ?? 0), 0),
    );

    const totalDeposit = r(
      project.project_incomes
        .filter((i) => i.currency === "LYD")
        .reduce((acc, i) => acc + (i.amount ?? 0), 0),
    );

    const remaingAmount = r(
      lydBalances.reduce((acc, a) => acc + (a.balance ?? 0), 0),
    );
    const totalAmount = r(totalMetrials + totalLabors);

    const today = new Date().toISOString().split("T")[0];

    return {
      serial_number: project.serial_number,
      invoice_date: today,
      project_name: project.name,
      project_location: project.address,
      start_date: today,
      end_date: today,

      finance_invoice: {
        total_metrial: totalMetrials,
        total_labor: totalLabors,
        total_not_paid: totalNotPaid,
        total_refund: totalRefund,
        total_company_percentage: totalCompanyPercentage,
        total_deposit: totalDeposit,
        remaing_amount: remaingAmount,
        total_amount: totalAmount,
      },

      metrials: sumByName(
        lydExpenses
          .filter((e) => e.expense_type === "material")
          .map((e) => ({
            name: e.description,
            total_price: r(e.total_amount ?? 0),
          })),
      ),

      labors: sumByName(
        lydExpenses
          .filter((e) => e.expense_type === "labor")
          .map((e) => ({
            name: e.description,
            total_price: r(e.total_amount ?? 0),
          })),
      ),

      refund: project.project_refund
        .filter((rf) => rf.currency === "LYD")
        .sort((a, b) => (a.serial_number ?? 0) - (b.serial_number ?? 0))
        .map((rf) => ({
          name: rf.description,
          serial_number: rf.serial_number,
          amount: r(rf.amount ?? 0),
          date: rf.income_date,
        })),

      deposit: project.project_incomes
        .filter((i) => i.currency === "LYD")
        .sort((a, b) => (a.serial_number ?? 0) - (b.serial_number ?? 0))
        .map((i) => ({
          name: i.client_name,
          serial_number: i.serial_number,
          amount: r(i.amount ?? 0),
          method: i.payment_method === "bank" ? "بنك" : "كاش",
          description: i.description,
          date: i.income_date,
        })),
    };
  };

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      if (!project) throw new Error("لا يوجد مشروع");
      const response = await fetchManagementApi(
        "/api/v1/egc/management/invoice/summed/pdf",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formatPayload(project)),
        },
      );

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      window.open(url, "_blank");

      // Optional cleanup after some time
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      setError(
        "فشل إنشاء الفاتورة: " +
          (err instanceof Error ? err.message : "خطأ غير معروف"),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        onClick={handleGenerate}
        disabled={loading}
        variant="primary-light"
      >
        {loading ? "جاري الانشاء..." : "انشاء فاتورة (مجمعة)"}
      </Button>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
