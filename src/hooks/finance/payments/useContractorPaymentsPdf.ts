import { useState } from "react";
import { fetchManagementApi } from "../../../lib/managementApiClient";
import { ContractPayment } from "../../../types/contracts.type";
import { formatDate } from "../../../utils/helpper";

interface ContractorPaymentPdfItem {
  payments_number: string;
  project_name: string;
  contractor_name: string;
  prev_amount: number;
  amount: number;
  penalty_amount: number;
  penalty_reason: string | null;
  payments_reason: string | null;
  grand_total: number;
  currency: string;
  method: string;
  created_at: string;
  created_by_name: string;
  expense_reference: string | null;
  bank_name: string | null;
  bank_number: string | null;
  bank_holder_name: string | null;
  whatsapp_number: string | null;
}

function toPdfItem(payment: ContractPayment): ContractorPaymentPdfItem {
  return {
    payments_number: payment.payments_number,
    project_name: payment.project?.name ?? "",
    contractor_name: payment.contractor
      ? `${payment.contractor.first_name} ${payment.contractor.last_name ?? ""}`.trim()
      : (payment.new_contractor_name ?? ""),
    prev_amount: payment.prev_amount,
    amount: payment.amount,
    penalty_amount: payment.penalty_amount,
    penalty_reason: payment.penalty_reason,
    payments_reason: payment.payments_reason,
    grand_total: payment.grand_total ?? 0,
    currency: payment.currency,
    method:
      payment.method === "cash"
        ? "نقداً"
        : payment.method === "bank"
          ? "بنك"
          : "—",
    created_at: formatDate(payment.created_at),
    created_by_name: payment.created_by_employee
      ? `${payment.created_by_employee.first_name} ${payment.created_by_employee.last_name ?? ""}`.trim()
      : "",
    expense_reference: payment.expense_id,
    bank_name: payment.bank_name,
    bank_number: payment.bank_number,
    bank_holder_name: payment.bank_holder_name,
    whatsapp_number: payment.contractor?.whatsapp_number ?? null,
  };
}

export function useContractorPaymentsPdf() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(payments: ContractPayment[]) {
    setLoading(true);
    setError(null);
    try {
      const payload = { payments: payments.map(toPdfItem) };

      const res = await fetchManagementApi(
        "/api/v1/egc/management/contractor-payment/pdf",
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

      return true;
    } catch (err) {
      console.error("Error generating contractor payments PDF:", err);
      setError(
        "فشل إنشاء تقرير المدفوعات: " +
          (err instanceof Error ? err.message : "خطأ غير معروف"),
      );
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { generate, loading, error };
}
