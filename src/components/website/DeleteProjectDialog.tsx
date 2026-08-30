import React, { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import Dialog from "../ui/Dialog";
import Button from "../ui/Button";

const generateCode = () =>
  Math.floor(1000 + Math.random() * 9000).toString();

type DeleteProjectDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  projectTitle: string;
  loading?: boolean;
};

const DeleteProjectDialog: React.FC<DeleteProjectDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  projectTitle,
  loading = false,
}) => {
  const [code, setCode] = useState(generateCode);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCode(generateCode());
      setInput("");
      setError(null);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (input.trim() !== code) {
      setError("الكود غير صحيح. حاول مرة أخرى.");
      return;
    }
    setError(null);
    await onConfirm();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-error">
          <AlertTriangle className="w-5 h-5" />
          <h2 className="text-lg font-bold">حذف المشروع نهائيًا</h2>
        </div>

        <p className="text-sm text-gray-600">
          سيتم حذف مشروع <span className="font-medium">{projectTitle}</span>{" "}
          وجميع صوره نهائيًا. لا يمكن التراجع عن هذا الإجراء.
        </p>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-sm text-gray-700">
            لتأكيد الحذف، اكتب هذا الكود:
          </p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="rounded-md border bg-white px-3 py-2 font-mono text-lg tracking-[0.4em]">
              {code}
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setCode(generateCode())}
              disabled={loading}
            >
              تغيير الكود
            </Button>
          </div>
        </div>

        <div>
          <input
            autoFocus
            inputMode="numeric"
            value={input}
            onChange={(e) => {
              setInput(e.target.value.replace(/\D/g, "").slice(0, 4));
              setError(null);
            }}
            placeholder="اكتب 4 أرقام"
            className="w-full rounded-md border px-3 py-2 text-center font-mono text-lg tracking-[0.4em] outline-none focus:ring-2 focus:ring-red-500"
          />
          {error && <p className="mt-2 text-sm text-error">{error}</p>}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            إلغاء
          </Button>
          <Button
            type="button"
            variant="error"
            onClick={handleConfirm}
            loading={loading}
            disabled={input.length !== 4}
          >
            تأكيد الحذف النهائي
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default DeleteProjectDialog;
