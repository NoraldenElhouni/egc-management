import { useEffect, useRef, useState } from "react";
import Tooltip from "../../ui/Tooltip";
import { useTemplateMode } from "../TemplateModeContext";
import { workingDaysLabel } from "./workingDays";

// "Days needed" — tasks.duration_days, the number of working days a task
// takes (Friday excluded). The due date is computed from it, so changing it
// moves the due date and every task linked after this one. Click to type a
// new number, Enter / leaving the field saves, Esc cancels. A summary (a
// parent with subtasks) spans its subtasks, so its days are read-only.
// On a template board every Day counts; they become working days (Friday
// skipped) when the template is applied from a start date.

interface DurationCellProps {
  days: number | null;
  onChange: (days: number) => void;
  readOnly?: boolean;
  isSummary?: boolean;
  /** Wider input, for the detail panel. */
  size?: "sm" | "md";
}

export default function DurationCell({ days, onChange, readOnly = false, isSummary = false, size = "sm" }: DurationCellProps) {
  const isTemplate = useTemplateMode();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const locked = readOnly || isSummary;

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const n = Math.floor(Number(draft));
    if (!Number.isFinite(n) || n < 1 || n > 3650 || n === days) return;
    onChange(n);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min={1}
        max={3650}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        className={`${size === "md" ? "w-20" : "w-14"} rounded border border-primary px-1.5 py-0.5 text-center text-xs outline-none`}
        dir="ltr"
      />
    );
  }

  const label = days ? `${days} يوم` : "—";
  const tooltip = !days
    ? locked ? "" : "عدد أيام العمل"
    : isSummary
      ? `${workingDaysLabel(days)} · من أول مهمة فرعية إلى آخرها`
      : isTemplate
        ? `${workingDaysLabel(days)} — الجمعة تُستثنى عند تطبيق القالب`
        : `${workingDaysLabel(days)} (بدون الجمعة)`;

  const button = (
    <button
      onClick={() => {
        if (locked) return;
        setDraft(days ? String(days) : "1");
        setEditing(true);
      }}
      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
        days ? "bg-gray-50 text-gray-600" : "text-gray-300"
      } ${locked ? "cursor-default" : "hover:bg-gray-100"} ${isSummary ? "italic" : ""}`}
    >
      {label}
    </button>
  );

  return tooltip ? <Tooltip label={tooltip}>{button}</Tooltip> : button;
}
