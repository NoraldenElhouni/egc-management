import { useRef, useState } from "react";
import { Flag } from "lucide-react";
import Badge, { type BadgeVariant } from "../../ui/Badge";
import { useClickOutside } from "../../../hooks/tasks/useClickOutside";
import type { Priority } from "../../../hooks/tasks/useTaskBoard";

const PRIORITY_LABELS: Record<Priority, string> = {
  urgent: "عاجل",
  high: "مرتفعة",
  normal: "عادية",
  low: "منخفضة",
};

const PRIORITY_VARIANTS: Record<Priority, BadgeVariant> = {
  urgent: "danger",
  high: "warning",
  normal: "info",
  low: "default",
};

const PRIORITIES: Priority[] = ["urgent", "high", "normal", "low"];

interface PriorityCellProps {
  priority: Priority | null;
  onChange: (priority: Priority | null) => void;
}

export default function PriorityCell({ priority, onChange }: PriorityCellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      {priority ? (
        <Badge
          label={PRIORITY_LABELS[priority]}
          variant={PRIORITY_VARIANTS[priority]}
          size="sm"
          onClick={() => setOpen((v) => !v)}
        />
      ) : (
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-full p-1 text-gray-300 hover:bg-gray-100 hover:text-gray-400"
          title="تعيين الأولوية"
        >
          <Flag className="h-3.5 w-3.5" />
        </button>
      )}

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              onClick={() => {
                onChange(p);
                setOpen(false);
              }}
              className="flex w-full items-center px-3 py-1.5 text-right text-sm hover:bg-gray-50"
            >
              <Badge label={PRIORITY_LABELS[p]} variant={PRIORITY_VARIANTS[p]} size="sm" />
            </button>
          ))}
          {priority && (
            <button
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="w-full px-3 py-1.5 text-right text-sm text-gray-400 hover:bg-gray-50"
            >
              بدون أولوية
            </button>
          )}
        </div>
      )}
    </div>
  );
}
