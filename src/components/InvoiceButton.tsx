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

  if (!project) {
    return <ErrorPage />;
  }

  const formatPayload = (project: ProjectWithDetailsForBook | null) => {
    const totalMetrials =
      project?.project_expenses
        .filter(
          (expense) =>
            expense.expense_type === "material" && expense.currency === "LYD",
        )
        .reduce((acc, expense) => acc + (expense.total_amount || 0), 0) || 0;

    const totalLabors =
      project?.project_expenses
        .filter(
          (expense) =>
            expense.expense_type === "labor" && expense.currency === "LYD",
        )
        .reduce((acc, expense) => acc + (expense.total_amount || 0), 0) || 0;

    const totalNotPaid =
      project?.project_expenses
        .filter((expense) => expense.currency === "LYD")
        .reduce(
          (acc, expense) =>
            acc + (expense.total_amount || 0 - expense.amount_paid || 0),
          0,
        ) || 0;

    const totalRefund =
      project?.project_refund
        .filter((refund) => refund.currency === "LYD")
        .reduce((acc, refund) => acc + (refund.amount || 0), 0) || 0;

    const totalCompanyPercentage =
      project?.accounts
        .filter((account) => account.currency === "LYD")
        .reduce((acc, account) => acc + (account.total_percentage || 0), 0) ||
      0;

    const totalDeposit =
      project?.project_incomes
        .filter((income) => income.currency === "LYD")
        .reduce((acc, income) => acc + (income.amount || 0), 0) || 0;

    const remaingAmount =
      project?.accounts
        .filter((account) => account.currency === "LYD")
        .reduce((acc, account) => acc + (account.balance || 0), 0) || 0;

    const totalAmount =
      project?.accounts
        .filter((account) => account.currency === "LYD")
        .reduce((acc, account) => acc + (account.balance || 0), 0) || 0;

    const PAYLOAD = {
      serial_number: project?.serial_number,
      invoice_date: new Date().toISOString().split("T")[0],
      client_name: project?.client.first_name + " " + project?.client.last_name,
      project_location: project?.address,
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date().toISOString().split("T")[0],
      finance_invoice: {
        total_metrials: totalMetrials,
        total_labors: totalLabors,
        total_not_paid: totalNotPaid,
        total_refund: totalRefund,
        total_company_percentage: totalCompanyPercentage,
        total_deposit: totalDeposit,
        remaing_amount: remaingAmount,
        total_amount: totalAmount,
      },
      metrials: project?.project_expenses
        .filter(
          (expense) =>
            expense.expense_type === "material" && expense.currency === "LYD",
        )
        .map((expense) => ({
          name: expense.description,
          serial_number: expense.serial_number,
          total_price: expense.total_amount || 0,
        })),
      labors: project?.project_expenses
        .filter(
          (expense) =>
            expense.expense_type === "labor" && expense.currency === "LYD",
        )
        .map((expense) => ({
          name: expense.description,
          contractor_name: expense.contract_name || "غير معروف",
          serial_number: expense.serial_number,
          total_price: expense.total_amount || 0,
        })),
      refund: project?.project_refund
        .filter((refund) => refund.currency === "LYD")
        .map((refund) => ({
          name: refund.description,
          serial_number: refund.serial_number,
          amount: refund.amount || 0,
        })),
      deposit: project?.project_incomes
        .filter((income) => income.currency === "LYD")
        .map((income) => ({
          name: income.description,
          serial_number: income.serial_number,
          amount: income.amount || 0,
        })),
    };
    // Here you would transform the `project` data into the structure expected by your API.
    // For this example, we'll just return the static PAYLOAD, but in a real implementation,
    // you'd map the project details to the payload format.
    return PAYLOAD;
  };

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        "http://node10588-env-5868938.tip2.libyanspider.cloud:11044/api/v1/egc/invoice/pdf",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formatPayload(project)),
        },
      );

      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `INV-${project?.serial_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      console.error("Error generating invoice:", err);
      if (err instanceof Error) {
        setError("فشل إنشاء الفاتورة: " + err.message);
      } else {
        setError("فشل إنشاء الفاتورة: خطأ غير معروف");
      }
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
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
