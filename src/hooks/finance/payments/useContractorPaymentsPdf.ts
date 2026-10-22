import { useState } from "react";
import { agreementsDb } from "../../../lib/agreementsDb";
import { fetchManagementApi } from "../../../lib/managementApiClient";
import type { AgreementDetail } from "../../../types/agreements.types";
import { ContractPayment } from "../../../types/contracts.type";
import { itemsAtVersion } from "../../../utils/agreements/versions";
import { formatDate } from "../../../utils/helpper";

export interface ContractorPaymentPdfItem {
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
  contractor_phone: string | null;

  // The agreement the payment is paid against. Null on old payments, made
  // before agreements existed.
  agreement_title: string | null;
  /** The agreement's total when the payment was made. */
  agreement_total: number | null;
  agreement_version: number | null;
  /** agreement_total − prev_amount − amount */
  remaining_after: number | null;
  /** Paid as plain expenses before the agreement was created. */
  opening_paid: number;
  /** How many expense payments opening_paid is made of. */
  opening_payments: number;
  // The agreement itself, as it stood at agreement_version (null / empty on
  // old payments).
  agreement_description: string | null;
  agreement_note: string | null;
  agreement_created_at: string | null;
  agreement_created_by_name: string | null;
  agreement_items: ContractorPaymentPdfAgreementItem[];

  /** Itemized; empty → the template uses penalty_amount / penalty_reason. */
  penalties: { reason: string | null; amount: number }[];

  approved_by_name: string | null;
  approved_at: string | null;
}

export interface ContractorPaymentPdfAgreementItem {
  no: number;
  description: string;
  quantity: number;
  unit_name: string | null;
  unit_price: number;
  /** quantity × unit_price */
  total: number;
  note: string | null;
}

/** `detail` = contracts.agreement_detail() of the payment's agreement. */
export function contractPaymentToPdfItem(
  payment: ContractPayment,
  detail?: AgreementDetail | null,
): ContractorPaymentPdfItem {
  const agreement = payment.agreement;
  const version = agreement
    ? detail?.versions.find((v) => v.version_no === agreement.version)
    : undefined;
  const v1 = detail?.versions.find((v) => v.version_no === 1);
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
    expense_reference: payment.expense
      ? [payment.expense.serial_number, payment.expense.description]
          .filter((part) => part !== null && part !== "")
          .join(" - ") || null
      : null,
    bank_name: payment.bank_name,
    bank_number: payment.bank_number,
    bank_holder_name: payment.bank_holder_name,
    whatsapp_number: payment.contractor?.whatsapp_number ?? null,
    contractor_phone: payment.contractor?.phone_number ?? null,

    agreement_title: agreement?.title ?? null,
    agreement_total: agreement?.total ?? null,
    agreement_version: agreement?.version ?? null,
    remaining_after: agreement
      ? agreement.total - (Number(payment.prev_amount) || 0) - (Number(payment.amount) || 0)
      : null,
    opening_paid: agreement?.opening_paid ?? 0,
    opening_payments: detail?.agreement.opening_payments ?? 0,
    agreement_description: version?.description ?? detail?.agreement.description ?? null,
    agreement_note: version ? version.note : (detail?.agreement.note ?? null),
    agreement_created_at: detail ? formatDate(detail.agreement.created_at) : null,
    agreement_created_by_name: v1?.created_by_name ?? detail?.agreement.created_by_name ?? null,
    agreement_items:
      agreement && detail
        ? itemsAtVersion(detail.items, agreement.version).map((item, i) => ({
            no: i + 1,
            description: item.description,
            quantity: Number(item.quantity) || 0,
            unit_name: item.unit_name,
            unit_price: Number(item.unit_price) || 0,
            total: Number(item.price) || 0,
            note: item.note,
          }))
        : [],

    penalties: payment.penalties ?? [],

    approved_by_name: payment.approved_by_employee
      ? `${payment.approved_by_employee.first_name} ${payment.approved_by_employee.last_name ?? ""}`.trim()
      : null,
    approved_at: payment.approved_at ? formatDate(payment.approved_at) : null,
  };
}

/** Loads each payment's agreement once, then builds the PDF rows. */
export async function buildContractorPaymentPdfItems(
  payments: ContractPayment[],
): Promise<ContractorPaymentPdfItem[]> {
  const ids = [...new Set(payments.map((p) => p.agreement?.id).filter(Boolean))] as string[];
  const details = new Map(
    await Promise.all(
      ids.map(async (id) => {
        const { data, error } = await agreementsDb
          .schema("contracts")
          .rpc("agreement_detail", { p_agreement_id: id });
        if (error) throw error;
        return [id, data as AgreementDetail | null] as const;
      }),
    ),
  );
  return payments.map((p) => contractPaymentToPdfItem(p, p.agreement ? details.get(p.agreement.id) : null));
}

export function useContractorPaymentsPdf() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(payments: ContractPayment[]) {
    setLoading(true);
    setError(null);
    try {
      const payload = { payments: await buildContractorPaymentPdfItems(payments) };

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
