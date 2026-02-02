import { useEffect, useMemo, useState } from "react";

type ExpenseLite = {
  id: string;
  serial_number?: number | string | null;
  description?: string | null;
};

interface DeleteExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  expense: ExpenseLite;
}

const DeleteExpenseDialog = ({
  open,
  onClose,
  expense,
}: DeleteExpenseDialogProps) => {
  const [deleteCode, setDeleteCode] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ✅ confirmation code = last 4 digits from serial_number (fallback 1234)
  const confirmCode = useMemo(() => {
    const s = String(expense?.id ?? "");
    const digits = s.replace(/\D/g, "");
    return digits.length >= 4 ? digits.slice(-4) : "1234";
  }, [expense?.id]);

  const canDelete = deleteCode === confirmCode;

  const handleCloseDelete = () => {
    if (deleteLoading) return;
    setDeleteCode("");
    setDeleteError(null);
    onClose();
  };

  // ✅ reset when dialog opens
  useEffect(() => {
    if (!open) return;
    setDeleteCode("");
    setDeleteError(null);
  }, [open]);

  // ✅ Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCloseDelete();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, deleteLoading]);

  const handleConfirmDelete = async () => {
    setDeleteError(null);

    if (!canDelete) {
      setDeleteError("الكود غير صحيح. أدخل آخر 4 أرقام من رقم المصروف.");
      return;
    }

    try {
      setDeleteLoading(true);
      console.log("🚨 Deleting expense with ID:", expense.id);

      handleCloseDelete();
    } catch (e) {
      console.log("❌ Error deleting expense:", e);
      setDeleteError("فشل حذف المصروف. حاول مرة أخرى.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* overlay */}
      <button
        type="button"
        onClick={handleCloseDelete}
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        disabled={deleteLoading}
      />

      {/* modal */}
      <div className="absolute left-1/2 top-1/2 w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">
            تأكيد حذف المصروف
          </h3>

          <button
            type="button"
            onClick={handleCloseDelete}
            disabled={deleteLoading}
            className="rounded px-2 py-1 text-sm hover:bg-gray-100 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <p className="font-semibold">هل أنت متأكد؟</p>
          <p className="mt-1 text-red-700">
            سيتم حذف المصروف وقد يتم عكس الأرصدة/الحركات المرتبطة به حسب نظامك.
          </p>
          <p className="mt-2 text-red-700">
            المصروف:{" "}
            <span className="font-semibold">
              {expense?.serial_number ?? "-"}
            </span>
            {" — "}
            {expense?.description ?? ""}
          </p>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-semibold text-gray-700">
            أدخل كود التأكيد (4 أرقام) {confirmCode}
          </label>

          <input
            value={deleteCode}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 4);
              setDeleteCode(v);
              setDeleteError(null);
            }}
            inputMode="numeric"
            maxLength={4}
            className="mt-2 w-full rounded border px-3 py-2 text-sm outline-none focus:border-red-400"
            placeholder="مثال: 1234"
          />

          <div className="mt-2 text-xs text-gray-500">
            الكود المطلوب هو آخر 4 أرقام من رقم المصروف.
          </div>

          {deleteError && (
            <div className="mt-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
              {deleteError}
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleCloseDelete}
            disabled={deleteLoading}
            className="rounded bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200 disabled:opacity-50"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={!canDelete || deleteLoading}
            className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleteLoading ? "جاري الحذف..." : "تأكيد الحذف"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteExpenseDialog;
