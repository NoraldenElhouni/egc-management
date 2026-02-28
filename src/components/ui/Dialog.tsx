import { useEffect, ReactNode } from "react";

type DialogProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

function Dialog({ isOpen, onClose, children }: DialogProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-lg bg-white p-6 shadow-lg"
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-xl text-gray-500 hover:text-black"
        >
          ×
        </button>
        <div className="m-4">{children}</div>
      </div>
    </div>
  );
}

export default Dialog;
