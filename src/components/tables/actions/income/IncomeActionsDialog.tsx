import { useEffect, useState } from "react";
import Button from "../../../ui/Button";
import { useIncome } from "../../../../hooks/projects/useIncome";

type Props = {
  projectId: string;
  incomeId: string;
};

export function IncomeActionsDialog({ projectId, incomeId }: Props) {
  const [open, setOpen] = useState(false);
  const { deleteIncome } = useIncome(projectId);

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
  // const handleEdit = () => {
  //   setOpen(false);
  //   console.log("Edit income", { projectId, incomeId });
  // };

  // delete function onclick
  const handleDelete = async () => {
    setOpen(false);
    const res = await deleteIncome(projectId, incomeId);
    if (res.error) {
      console.error("Failed to delete income", res.error);
    } else {
      console.log("Income deleted successfully");
      window.location.reload(); // Refresh the page to reflect changes. In a real app, you'd want to update state instead.
    }
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
              <h3 className="text-base font-semibold">إجراءات الدخل</h3>
              <Button
                type="button"
                onClick={() => setOpen(false)}
                variant="ghost"
              >
                ✕
              </Button>
            </div>

            <div className="mt-4 grid gap-2">
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
