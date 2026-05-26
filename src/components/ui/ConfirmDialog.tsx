import React, { useEffect, useRef } from "react";
import Button from "./Button"; // adjust path as needed

// ─── Types ─────────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Called when the user confirms */
  onConfirm: () => void;
  /** Called when the user cancels or clicks the backdrop */
  onCancel: () => void;

  /** Dialog title — defaults to "هل أنت متأكد؟" */
  title?: string;
  /** Dialog message — defaults to "هل تريد المتابعة؟ لا يمكن التراجع عن هذا الإجراء." */
  message?: string;

  /** Label for the confirm button — defaults to "تأكيد" */
  confirmLabel?: string;
  /** Label for the cancel button — defaults to "إلغاء" */
  cancelLabel?: string;

  /** Variant for the confirm button — defaults to "success" */
  confirmVariant?: React.ComponentProps<typeof Button>["variant"];
  /** Show a loading spinner on the confirm button */
  loading?: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onConfirm,
  onCancel,
  title = "هل أنت متأكد؟",
  message = "هل تريد المتابعة؟ لا يمكن التراجع عن هذا الإجراء.",
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  confirmVariant = "success",
  loading = false,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  // Trap focus inside dialog when open
  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
      aria-modal="true"
      role="dialog"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Card — stop click bubbling so backdrop click doesn't fire inside the card */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-5 outline-none animate-in fade-in zoom-in-95 duration-200"
        dir="rtl"
      >
        {/* Icon + Title */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-2xl">
            ⚠️
          </div>
          <h2
            id="confirm-dialog-title"
            className="text-lg font-bold text-gray-800"
          >
            {title}
          </h2>
        </div>

        {/* Message */}
        <p className="text-sm text-gray-500 text-center leading-relaxed">
          {message}
        </p>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          {/* Cancel — always on the right in RTL */}
          <Button
            variant="muted"
            size="md"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            {cancelLabel}
          </Button>

          {/* Confirm */}
          <Button
            variant={confirmVariant}
            size="md"
            onClick={onConfirm}
            loading={loading}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
