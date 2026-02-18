import { useEffect, useState } from "react";
import Button from "../../../ui/Button";
import { useRefund } from "../../../../hooks/projects/useRefund";

type Props = {
  projectId: string;
  refundId: string;
};

function generate4DigitCode() {
  // 1000 - 9999
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function RefundActionsDialog({ projectId, refundId }: Props) {
  const [open, setOpen] = useState(false);
  const { deleteRefund, loading, error } = useRefund(projectId);

  // confirm state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmCode, setConfirmCode] = useState(() => generate4DigitCode());
  const [confirmInput, setConfirmInput] = useState("");
  const [localMsg, setLocalMsg] = useState<string | null>(null);

  // Close on ESC (close confirm first, then main dialog)
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (confirmOpen) {
          setConfirmOpen(false);
          setConfirmInput("");
          setLocalMsg(null);
        } else {
          setOpen(false);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, confirmOpen]);

  // Reset confirm state whenever opening dialog
  useEffect(() => {
    if (!open) return;
    setConfirmOpen(false);
    setConfirmInput("");
    setLocalMsg(null);
    setConfirmCode(generate4DigitCode());
  }, [open]);

  const handleEdit = () => {
    setOpen(false);
    console.log("Edit refund", { projectId, refundId });
  };

  const openConfirm = () => {
    setLocalMsg(null);
    setConfirmInput("");
    setConfirmCode(generate4DigitCode());
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setConfirmInput("");
    setLocalMsg(null);
  };

  const handleConfirmDelete = async () => {
    setLocalMsg(null);

    if (confirmInput.trim() !== confirmCode) {
      setLocalMsg("الكود غير صحيح. حاول مرة أخرى.");
      return;
    }

    const res = await deleteRefund(refundId);

    if (res?.success) {
      // close all
      closeConfirm();
      setOpen(false);
    } else {
      setLocalMsg(res?.message || "فشل حذف الاسترداد");
    }
  };

  // keep only digits and max 4
  const onChangeCode = (v: string) => {
    const digitsOnly = v.replace(/\D/g, "").slice(0, 4);
    setConfirmInput(digitsOnly);
    setLocalMsg(null);
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
            onClick={() => (confirmOpen ? closeConfirm() : setOpen(false))}
            className="absolute inset-0 bg-black/40"
          />

          {/* Modal box */}
          <div className="absolute left-1/2 top-1/2 w-[92%] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">إجراءات الاسترداد</h3>
              <Button
                type="button"
                onClick={() => (confirmOpen ? closeConfirm() : setOpen(false))}
                variant="ghost"
                disabled={loading}
              >
                ✕
              </Button>
            </div>

            {/* confirm view */}
            {confirmOpen ? (
              <div className="mt-4">
                <p className="text-sm text-gray-700">
                  لتأكيد الحذف، اكتب هذا الكود:
                </p>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="rounded-md border bg-gray-50 px-3 py-2 font-mono text-lg tracking-[0.4em]">
                    {confirmCode}
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setConfirmCode(generate4DigitCode())}
                    disabled={loading}
                  >
                    تغيير الكود
                  </Button>
                </div>

                <div className="mt-3">
                  <input
                    autoFocus
                    inputMode="numeric"
                    value={confirmInput}
                    onChange={(e) => onChangeCode(e.target.value)}
                    placeholder="اكتب 4 أرقام"
                    className="w-full rounded-md border px-3 py-2 text-center font-mono text-lg tracking-[0.4em] outline-none focus:ring-2"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    لن يتم الحذف إلا بعد إدخال الكود الصحيح.
                  </p>

                  {(localMsg || error) && (
                    <p className="mt-2 text-sm text-red-600">
                      {localMsg || error?.message || "حدث خطأ"}
                    </p>
                  )}
                </div>

                <div className="mt-4 grid gap-2">
                  <Button
                    type="button"
                    onClick={handleConfirmDelete}
                    variant="error"
                    disabled={loading || confirmInput.length !== 4}
                  >
                    {loading ? "جارٍ الحذف..." : "تأكيد الحذف"}
                  </Button>

                  <Button
                    type="button"
                    onClick={closeConfirm}
                    variant="ghost"
                    disabled={loading}
                  >
                    رجوع
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* normal actions */}
                {error && (
                  <p className="mt-3 text-sm text-red-600">
                    حدث خطأ: {error?.message ?? "غير معروف"}
                  </p>
                )}

                <div className="mt-4 grid gap-2">
                  <Button
                    onClick={handleEdit}
                    variant="secondary"
                    disabled={loading}
                  >
                    تعديل
                  </Button>

                  <Button
                    onClick={openConfirm}
                    variant="error"
                    disabled={loading}
                  >
                    حذف
                  </Button>
                </div>

                <div className="mt-4">
                  <Button
                    onClick={() => setOpen(false)}
                    variant="ghost"
                    disabled={loading}
                  >
                    إلغاء
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
