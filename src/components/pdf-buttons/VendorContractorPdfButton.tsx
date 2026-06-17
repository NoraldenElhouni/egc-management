import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

// ─── Types ────────────────────────────────────────────────────────────────────

type EntityType = "contractor" | "vendor";

interface InvoiceItem {
  project_name: string;
  invoice_number: string;
  amount: number;
  date: string;
}

interface VendorsContractorsReportPayload {
  name: string;
  total_amount: number;
  invoices: InvoiceItem[];
}

interface Props {
  id: string;
  type: EntityType;
}

// ─── Data Fetching ────────────────────────────────────────────────────────────

async function fetchPayload(
  id: string,
  type: EntityType,
): Promise<VendorsContractorsReportPayload> {
  if (type === "contractor") {
    // 1. Fetch contractor name
    const { data: contractor, error: contractorError } = await supabase
      .from("contractors")
      .select("first_name, last_name")
      .eq("id", id)
      .single();

    if (contractorError) throw new Error(contractorError.message);

    const name =
      `${contractor.first_name} ${contractor.last_name ?? ""}`.trim();

    // 2. Fetch expenses linked to this contractor, joining project name
    const { data: expenses, error: expensesError } = await supabase
      .from("project_expenses")
      .select(
        `serial_number, total_amount, expense_date,
         project:projects!project_expenses_project_id_fkey(name)`,
      )
      .eq("contractor_id", id)
      .is("deleted_at", null);

    if (expensesError) throw new Error(expensesError.message);

    const invoices: InvoiceItem[] = (expenses ?? []).map((e) => ({
      project_name: (e.project as { name: string } | null)?.name ?? "—",
      invoice_number: e.serial_number?.toString() ?? "—",
      amount: Number(e.total_amount ?? 0),
      date: e.expense_date,
    }));

    const total_amount =
      Math.round(invoices.reduce((sum, i) => sum + i.amount, 0) * 100) / 100;

    return { name, total_amount, invoices };
  } else {
    // 1. Fetch vendor name
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("vendor_name")
      .eq("id", id)
      .single();

    if (vendorError) throw new Error(vendorError.message);

    const name = vendor.vendor_name;

    // 2. Fetch expenses linked to this vendor, joining project name
    const { data: expenses, error: expensesError } = await supabase
      .from("project_expenses")
      .select(
        `serial_number, total_amount, expense_date,
         project:projects!project_expenses_project_id_fkey(name)`,
      )
      .eq("vendor_id", id)
      .is("deleted_at", null);

    if (expensesError) throw new Error(expensesError.message);

    const invoices: InvoiceItem[] = (expenses ?? [])
      .sort((a, b) => {
        const nameA = (a.project as { name: string } | null)?.name ?? "";
        const nameB = (b.project as { name: string } | null)?.name ?? "";
        const nameCompare = nameA.localeCompare(nameB, "ar");
        if (nameCompare !== 0) return nameCompare;
        return (a.serial_number ?? 0) - (b.serial_number ?? 0);
      })
      .map((e) => ({
        project_name: (e.project as { name: string } | null)?.name ?? "—",
        invoice_number: e.serial_number?.toString() ?? "—",
        amount: Number(e.total_amount ?? 0),
        date: e.expense_date,
      }));

    const total_amount =
      Math.round(invoices.reduce((sum, i) => sum + i.amount, 0) * 100) / 100;

    return { name, total_amount, invoices };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

const VendorContractorPdfButton = ({ id, type }: Props) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchPayload(id, type);

      const res = await fetch(
        "http://102.203.200.52/api/v1/egc/management/vendors-contractors/pdf",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      window.open(url, "_blank");

      // Optional cleanup after some time
      setTimeout(() => URL.revokeObjectURL(url), 10000);
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
        {loading ? "جاري الإنشاء..." : "طباعة كشف الحساب"}
      </button>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default VendorContractorPdfButton;
