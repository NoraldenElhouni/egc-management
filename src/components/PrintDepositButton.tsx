import React, { useState } from "react";
import Button from "./ui/Button";
import { supabase } from "../lib/supabaseClient";

interface PrintDepositButtonProps {
  incomeId: string;
}

const PrintDepositButton = ({ incomeId }: PrintDepositButtonProps) => {
  const [loading, setLoading] = useState(false);

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);

  // Form fields
  const [reason, setReason] = useState("");
  const [amountInWords, setAmountInWords] = useState("");
  const [note, setNote] = useState("");

  // Amount preview
  const [amount, setAmount] = useState<number>(0);

  /**
   * Open dialog + fetch amount first
   */
  const openPrintDialog = async () => {
    try {
      const { data, error } = await supabase
        .from("project_incomes")
        .select("amount")
        .eq("id", incomeId)
        .single();

      if (error || !data) {
        console.error(error);

        throw new Error("فشل جلب المبلغ");
      }

      setAmount(Number(data.amount ?? 0));

      setOpenDialog(true);
    } catch (err) {
      console.error(err);

      alert(err instanceof Error ? err.message : "حدث خطأ أثناء جلب البيانات");
    }
  };

  /**
   * Print PDF
   */
  const handlePrint = async () => {
    setLoading(true);

    try {
      // Fetch income with related project + user info
      const { data, error } = await supabase
        .from("project_incomes")
        .select(
          `
          serial_number,
          description,
          currency,
          amount,
          payment_method,
          fund,
          income_date,
          client_name,
          created_by,

          projects (
            name
          ),

          users!created_by (
            first_name,
            last_name
          )
        `,
        )
        .eq("id", incomeId)
        .single();

      if (error || !data) {
        console.error(error);

        throw new Error("فشل جلب بيانات الدخل");
      }

      // Build payload
      const income = {
        serial_number: String(data.serial_number ?? ""),
        description: data.description ?? "",
        currency: data.currency ?? "LYD",
        amount: Number(data.amount ?? 0),

        payment_method: data.payment_method ?? "",
        fund: data.fund ?? "",
        income_date: data.income_date ?? "",
        client_name: data.client_name ?? "",

        // New fields
        reason,
        amount_in_word: amountInWords,
        note,

        project_name: (data.projects as any)?.name ?? "",

        created_by: (() => {
          const u = (data as any)?.users;

          if (!u) return data.created_by ?? "";

          return `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
        })(),
      };

      console.log("PDF Payload:", income);

      // Call API
      const response = await fetch(
        "http://102.203.200.52/api/v1/egc/management/income/pdf",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(income),
        },
      );

      // Handle backend errors
      if (!response.ok) {
        const errText = await response.text();

        console.error("API Error:", errText);

        throw new Error(`فشل إنشاء PDF (${response.status})`);
      }

      // Check content type
      const contentType = response.headers.get("content-type");

      console.log("Content-Type:", contentType);

      // Convert to blob
      const blob = await response.blob();

      // Validate PDF
      if (!blob.type.includes("pdf") && contentType !== "application/pdf") {
        const text = await blob.text();

        console.error("Non-PDF Response:", text);

        throw new Error("الاستجابة ليست ملف PDF");
      }

      // Download file
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;

      a.download = `income-${income.serial_number}.pdf`;

      document.body.appendChild(a);

      a.click();

      a.remove();

      URL.revokeObjectURL(url);

      // Reset form
      setReason("");
      setAmountInWords("");

      // Close dialog
      setOpenDialog(false);
    } catch (err) {
      console.error(err);

      alert(err instanceof Error ? err.message : "حدث خطأ أثناء تحميل الإيصال");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Main Button */}
      <Button onClick={openPrintDialog}>طباعة إيصال</Button>

      {/* Dialog */}
      {openDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-bold">بيانات إضافية</h2>

            {/* Reason */}
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">السبب</label>

              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded border p-2"
                placeholder="أدخل السبب"
              />
            </div>

            {/* Amount Display */}
            <div className="mb-4 rounded bg-gray-100 p-3">
              <p className="text-sm text-gray-600">المبلغ:</p>

              <p className="text-lg font-bold">{amount} دينار</p>
            </div>

            {/* Amount In Words */}
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">
                المبلغ كتابة
              </label>

              <textarea
                value={amountInWords}
                onChange={(e) => setAmountInWords(e.target.value)}
                className="w-full rounded border p-2"
                rows={3}
                placeholder="أدخل المبلغ كتابة"
              />
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">ملاحظة </label>

              <textarea
                value={amountInWords}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded border p-2"
                rows={2}
                placeholder="أدخل ملاحظة"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button onClick={() => setOpenDialog(false)} disabled={loading}>
                إلغاء
              </Button>

              <Button
                onClick={handlePrint}
                disabled={loading || !reason.trim() || !amountInWords.trim()}
              >
                {loading ? "جارٍ إنشاء الإيصال..." : "تأكيد وطباعة"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PrintDepositButton;
