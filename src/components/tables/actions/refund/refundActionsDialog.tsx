import { useEffect, useState } from "react";
import Button from "../../../ui/Button";

type Props = {
  projectId: string;
  refundId: string;
};

export function RefundActionsDialog({ projectId, refundId }: Props) {
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

  // edit fucntion onclick
  const handleEdit = () => {
    setOpen(false);
    console.log("Edit refund", { projectId, refundId });
  };

  // delete function onclick
  const handleDelete = () => {
    setOpen(false);
    console.log("Delete refund", { projectId, refundId });
  };

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
              <Button
                type="button"
                onClick={() => setOpen(false)}
                variant="ghost"
              >
                ✕
              </Button>
            </div>

            <div className="mt-4 grid gap-2">
              <Button onClick={handleEdit} variant="secondary">
                تعديل
              </Button>

              <Button onClick={handleDelete} variant="error">
                حذف
              </Button>
            </div>

            <div className="mt-4">
              <Button onClick={() => setOpen(false)} variant="ghost">
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
