import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type Props = {
  projectId: string;
  expenseId: string;
};

export function ExpenseActionsDialog({ projectId, expenseId }: Props) {
  const [open, setOpen] = useState(false);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      {/* Button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
      >
        إجراءات
      </button>

      {/* Dialog */}
      {open && (
        <div className="fixed inset-0 z-[9999]">
          {/* Overlay */}
          <button
            type="button"
            aria-label="Close dialog"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />

          {/* Modal box */}
          <div className="absolute left-1/2 top-1/2 w-[92%] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">إجراءات المصروف</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded px-2 py-1 text-sm hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid gap-2">
              <Link
                to={`/finance/bookkeeping/project/${projectId}/expense/${expenseId}`}
                onClick={() => setOpen(false)}
                className="block rounded border px-3 py-2 text-center text-sm hover:bg-gray-50"
              >
                عرض التفاصيل
              </Link>

              <Link
                to={`/finance/bookkeeping/project/${projectId}/expense/${expenseId}/edit`}
                onClick={() => setOpen(false)}
                className="block rounded border px-3 py-2 text-center text-sm hover:bg-gray-50"
              >
                تعديل
              </Link>

              <Link
                to={`/finance/bookkeeping/project/${projectId}/expense/${expenseId}/delete`}
                onClick={() => setOpen(false)}
                className="block rounded border border-red-200 px-3 py-2 text-center text-sm text-red-600 hover:bg-red-50"
              >
                حذف
              </Link>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full rounded bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
