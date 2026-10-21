import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Lock } from "lucide-react";
import Dialog from "../ui/Dialog";
import Button from "../ui/Button";
import LoadingSpinner from "../ui/LoadingSpinner";
import { supabase } from "../../lib/supabaseClient";
import {
  agreementErrorMessage,
  useCreateAgreementPayment,
  usePaymentPreview,
} from "../../hooks/agreements/useAgreements";
import type { PaymentMethod } from "../../types/agreements.types";
import { formatCurrency } from "../../utils/helpper";
import { parseAmount } from "./AgreementFormDialog";

// A payment against an agreement. Payment number, previous amount and
// what's left come from the agreement; approved penalties not yet
// deducted are listed and taken off automatically — nothing to type.

const inputClass =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100";

type Props = {
  agreementId: string;
  contractorId: string;
  contractorName: string | null;
  title: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function AgreementPaymentDialog(props: Props) {
  if (!props.isOpen) return null;
  return <AgreementPaymentDialogBody {...props} />;
}

function AgreementPaymentDialogBody({
  agreementId,
  contractorId,
  contractorName,
  title,
  isOpen,
  onClose,
}: Props) {
  const preview = usePaymentPreview(agreementId);
  const pay = useCreateAgreementPayment(agreementId);
  const bank = useQuery({
    queryKey: ["contractor-bank", contractorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contractors")
        .select("bank_name, bank_number, bank_holder_name, bank_account_aproved")
        .eq("id", contractorId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("bank");
  const [bankEdits, setBankEdits] = useState<{ name?: string; number?: string; holder?: string }>({});
  const [error, setError] = useState<string | null>(null);

  // Saved details prefill the fields; once approved they can't be changed.
  const locked = !!bank.data?.bank_account_aproved;
  const bankName = bankEdits.name ?? bank.data?.bank_name ?? "";
  const bankNumber = bankEdits.number ?? bank.data?.bank_number ?? "";
  const bankHolderName = bankEdits.holder ?? bank.data?.bank_holder_name ?? "";

  const p = preview.data;
  const value = parseAmount(amount);

  const blocked = !p
    ? null
    : p.has_pending
      ? "توجد دفعة قيد الانتظار على هذه الاتفاقية — يجب قبولها أو رفضها أولاً"
      : p.remaining <= 0
        ? "تم دفع كامل الاتفاقية"
        : null;

  const missing = !p
    ? "..."
    : (blocked ??
      (value <= 0
        ? "اكتب مبلغ الدفعة"
        : value > p.remaining
          ? `المبلغ أكبر من المتبقي (${formatCurrency(p.remaining)})`
          : p.penalty_total > value
            ? `الغرامات (${formatCurrency(p.penalty_total)}) أكبر من مبلغ الدفعة`
            : method === "bank" && (!bankName.trim() || !bankNumber.trim() || !bankHolderName.trim())
              ? "أكمل بيانات الحساب البنكي"
              : null));

  const handleSubmit = () => {
    if (missing || pay.isPending) return;
    setError(null);
    pay.mutate(
      { amount: value, reason, method, bankName, bankNumber, bankHolderName },
      {
        onSuccess: onClose,
        onError: (err) => {
          setError(agreementErrorMessage(err));
          preview.refetch();
        },
      },
    );
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div dir="rtl" className="space-y-5 max-h-[78vh] overflow-y-auto px-1">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">دفعة جديدة</h2>
          <p className="text-sm text-gray-500 mt-1">
            {contractorName ?? "—"} · {title}
          </p>
        </div>

        {preview.isLoading || !p ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="رقم الدفعة" value={String(p.next_number)} />
              <Stat label="المدفوع سابقاً" value={formatCurrency(p.prev_amount)} />
              <Stat label="المتبقي" value={formatCurrency(p.remaining)} strong />
            </div>

            {blocked ? (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-center text-amber-800 font-medium">
                {blocked}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">المبلغ *</label>
                    <input
                      className={`${inputClass} text-lg font-semibold`}
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      autoFocus
                    />
                    <button
                      type="button"
                      className="text-xs text-blue-700 font-medium text-right hover:underline"
                      onClick={() => setAmount(String(p.remaining))}
                    >
                      دفع المتبقي كاملاً ({formatCurrency(p.remaining)})
                    </button>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">سبب الدفعة</label>
                    <textarea
                      className={inputClass}
                      rows={2}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>
                </div>

                {p.penalties.length > 0 && (
                  <div className="rounded-lg border border-red-200 bg-red-50/50 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-red-800">
                      <AlertTriangle className="w-4 h-4" /> غرامات ستُخصم تلقائياً
                    </div>
                    {p.penalties.map((pen) => (
                      <div key={pen.id} className="flex justify-between text-sm">
                        <span>{pen.reason}</span>
                        <span className="font-semibold text-red-700">−{formatCurrency(pen.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">طريقة الدفع</label>
                  <div className="flex gap-2">
                    {(
                      [
                        { value: "cash", label: "نقدي" },
                        { value: "bank", label: "تحويل بنكي" },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setMethod(m.value)}
                        className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${
                          method === m.value
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                  {method === "bank" && (
                    <>
                      {locked && (
                        <p className="flex items-center gap-1 text-xs text-blue-700">
                          <Lock className="w-3 h-3" /> بيانات الحساب البنكي معتمدة ولا يمكن تعديلها
                        </p>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          className={inputClass}
                          placeholder="اسم البنك *"
                          value={bankName}
                          disabled={locked}
                          onChange={(e) => setBankEdits((b) => ({ ...b, name: e.target.value }))}
                        />
                        <input
                          className={inputClass}
                          placeholder="رقم الحساب *"
                          value={bankNumber}
                          disabled={locked}
                          onChange={(e) => setBankEdits((b) => ({ ...b, number: e.target.value }))}
                        />
                        <input
                          className={inputClass}
                          placeholder="اسم صاحب الحساب *"
                          value={bankHolderName}
                          disabled={locked}
                          onChange={(e) => setBankEdits((b) => ({ ...b, holder: e.target.value }))}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3">
                  <span className="text-sm font-medium text-gray-600">
                    الصافي للمقاول{p.penalty_total > 0 ? " (بعد الغرامات)" : ""}
                  </span>
                  <span className="text-xl font-bold text-blue-800">
                    {formatCurrency(Math.max(0, value - p.penalty_total))}
                  </span>
                </div>
              </>
            )}
          </>
        )}

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-gray-500">{blocked ? "" : (missing ?? "")}</span>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              إلغاء
            </Button>
            {!blocked && (
              <Button type="button" onClick={handleSubmit} disabled={!!missing} loading={pay.isPending}>
                إرسال الدفعة
              </Button>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-base font-bold ${strong ? "text-blue-800" : "text-gray-900"}`}>{value}</div>
    </div>
  );
}
