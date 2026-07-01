import { useState } from "react";
import Button from "../ui/Button";
import ConfirmDialog from "../ui/ConfirmDialog";

interface BulkActionBarProps {
  count: number;
  actionLabel: string;
  confirmTitle: string;
  confirmMessage: string;
  onConfirm: () => Promise<void> | void;
  loading?: boolean;
}

const BulkActionBar = ({
  count,
  actionLabel,
  confirmTitle,
  confirmMessage,
  onConfirm,
  loading = false,
}: BulkActionBarProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (count === 0) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5">
      <span className="text-sm font-medium text-indigo-700">
        {count} صف محدد
      </span>

      <Button
        variant="success"
        size="sm"
        loading={loading}
        disabled={loading}
        onClick={() => setConfirmOpen(true)}
      >
        {actionLabel}
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false);
          await onConfirm();
        }}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel="نعم، تأكيد"
        confirmVariant="success"
      />
    </div>
  );
};

export default BulkActionBar;
