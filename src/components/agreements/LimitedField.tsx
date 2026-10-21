import { counterText, isOutOfRange, LIMITS, LimitKey, textLength } from "../../utils/agreements/rules";

// A text field with its length rule (utils/agreements/rules.ts): a live
// "12 / 80" counter, red while the text is too short or too long. Same
// rule the database enforces and the field app shows.

export const inputClass =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

type Props = {
  limit: LimitKey;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
  autoFocus?: boolean;
};

export default function LimitedField({ limit, value, onChange, label, placeholder, rows, autoFocus }: Props) {
  const { min, max } = LIMITS[limit];
  const bad = isOutOfRange(value, limit) && textLength(value) > 0;
  const className = `${inputClass} ${bad ? "border-red-300 focus:ring-red-400" : ""}`;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            {label}
            {min > 0 ? " *" : " (اختياري)"}
          </label>
          <span className={`text-xs ${bad ? "text-red-600" : "text-gray-400"}`}>{counterText(value, limit)}</span>
        </div>
      )}
      {rows ? (
        <textarea
          className={className}
          rows={rows}
          value={value}
          maxLength={max + 20}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className={className}
          value={value}
          maxLength={max + 20}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {!label && (
        <span className={`text-[11px] ${bad ? "text-red-600" : "text-gray-400"}`}>{counterText(value, limit)}</span>
      )}
      {min > 0 && textLength(value) > 0 && textLength(value) < min && (
        <span className="text-xs text-red-600">{min} حرفاً على الأقل</span>
      )}
    </div>
  );
}
