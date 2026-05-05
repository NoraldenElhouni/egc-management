import { useState } from "react";
import Button from "./ui/Button";
import { ProjectWithDetailsForBook } from "../types/projects.type";
import ErrorPage from "./ui/errorPage";

interface InvoiceButtonProps {
  project: ProjectWithDetailsForBook | null;
}

export default function InvoiceButton({ project }: InvoiceButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!project || project === null) return <ErrorPage />;

  const r = (n: number) => Math.round(n * 100) / 100;

  const formatPayload = (project: ProjectWithDetailsForBook) => {
    const lydExpenses = project.project_expenses.filter(
      (e) => e.currency === "LYD",
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

    const lydAccounts = project.accounts.filter((a) => a.currency === "LYD");

    const totalCompanyPercentage = r(
      lydAccounts.reduce((acc, a) => acc + (a.total_percentage ?? 0), 0),
    );

    const totalDeposit = r(
      project.project_incomes
        .filter((i) => i.currency === "LYD")
        .reduce((acc, i) => acc + (i.amount ?? 0), 0),
    );

    const remaingAmount = r(
      lydAccounts.reduce((acc, a) => acc + (a.balance ?? 0), 0),
    );

    // ✅ FIX 2: totalAmount = materials + labor (not same as remaingAmount)
    const totalAmount = r(totalMetrials + totalLabors);

    const today = new Date().toISOString().split("T")[0];

    return {
      serial_number: project.serial_number,
      invoice_date: today,
      client_name: `${project.client.first_name} ${project.client.last_name}`,
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

      metrials: lydExpenses
        .filter((e) => e.expense_type === "material")
        .sort((a, b) => (a.serial_number ?? 0) - (b.serial_number ?? 0)) // ✅ add this
        .map((e) => ({
          name: e.description,
          serial_number: e.serial_number,
          total_price: r(e.total_amount ?? 0),
        })),

      labors: lydExpenses
        .filter((e) => e.expense_type === "labor")
        .sort((a, b) => (a.serial_number ?? 0) - (b.serial_number ?? 0)) // ✅ add this
        .map((e) => ({
          name: e.description,
          contractor_name: e.contract_name ?? "غير معروف",
          serial_number: e.serial_number,
          total_price: r(e.total_amount ?? 0),
        })),

      refund: project.project_refund
        .filter((rf) => rf.currency === "LYD")
        .sort((a, b) => (a.serial_number ?? 0) - (b.serial_number ?? 0)) // ✅ add this
        .map((rf) => ({
          name: rf.description,
          serial_number: rf.serial_number,
          amount: r(rf.amount ?? 0),
        })),

      deposit: project.project_incomes
        .filter((i) => i.currency === "LYD")
        .sort((a, b) => (a.serial_number ?? 0) - (b.serial_number ?? 0)) // ✅ add this
        .map((i) => ({
          name: i.client_name,
          serial_number: i.serial_number,
          amount: r(i.amount ?? 0),
        })),
    };
  };

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      if (!project) throw new Error("لا يوجد مشروع");
      const response = await fetch(
        "http://102.203.200.52/api/v1/egc/management/invoice/pdf",
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
      const a = document.createElement("a");
      a.href = url;
      a.download = `INV-${project?.serial_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
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
        {loading ? "جاري الانشاء..." : "انشاء فاتورة"}
      </Button>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
