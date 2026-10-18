import { Plus, Trash2 } from "lucide-react";
import { LIST_OPERATORS, OPERATOR_LABELS, VALUELESS_OPERATORS } from "../../../config/notifications";
import type { Condition, ConditionLeaf } from "../../../services/notifications/notifyApi";
import { inputClass } from "./adminQueries";

// A flat list of conditions joined by "all" (و) or "any" (أو) — the shape
// almost every rule uses. Anything deeper (a "not", nested groups) is shown
// as JSON and edited as JSON, so the builder never silently loses a part of
// a rule it cannot draw. The database validates either way
// (notify.validate_condition).

type Join = "all" | "any";

interface Flat {
  join: Join;
  leaves: ConditionLeaf[];
}

function toFlat(c: Condition | null | undefined): Flat | null {
  if (!c || Object.keys(c).length === 0) return { join: "all", leaves: [] };
  if ("field" in c) return { join: "all", leaves: [c as ConditionLeaf] };
  const key = "all" in c ? "all" : "any" in c ? "any" : null;
  if (!key) return null;
  const items = (c as Record<Join, Condition[]>)[key];
  if (!items.every((x) => x && "field" in x)) return null;
  return { join: key, leaves: items as ConditionLeaf[] };
}

function fromFlat(f: Flat): Condition {
  const leaves = f.leaves.filter((l) => l.field);
  if (leaves.length === 0) return {};
  if (leaves.length === 1) return leaves[0];
  return { [f.join]: leaves } as Condition;
}

function valueText(l: ConditionLeaf): string {
  if (l.value === undefined || l.value === null) return "";
  if (Array.isArray(l.value)) return l.value.join("، ");
  return String(l.value);
}

/** Turn the typed text into the JSON the database compares: numbers and true/false as such. */
function parseValue(op: string, text: string): unknown {
  const one = (t: string): unknown => {
    const v = t.trim();
    if (v === "true") return true;
    if (v === "false") return false;
    if (v !== "" && /^-?\d+(\.\d+)?$/.test(v)) return Number(v);
    return v;
  };
  if (LIST_OPERATORS.has(op)) return text.split(/[،,]/).map(one).filter((v) => v !== "");
  return one(text);
}

interface ConditionBuilderProps {
  value: Condition;
  onChange: (next: Condition) => void;
  /** Column names offered for the field (plain names = the row; dotted = an enrichment). */
  fields: string[];
  disabled?: boolean;
}

export default function ConditionBuilder({ value, onChange, fields, disabled }: ConditionBuilderProps) {
  const flat = toFlat(value);

  if (!flat) {
    return (
      <div className="space-y-1">
        <p className="text-xs text-amber-700">هذا الشرط مركّب؛ يُعدَّل كنص JSON.</p>
        <textarea
          dir="ltr"
          className={`${inputClass} font-mono text-xs`}
          rows={6}
          disabled={disabled}
          defaultValue={JSON.stringify(value, null, 2)}
          onBlur={(e) => {
            try {
              onChange(JSON.parse(e.target.value));
            } catch {
              // keep the last valid value; the save button validates again
            }
          }}
        />
      </div>
    );
  }

  const update = (next: Flat) => onChange(fromFlat(next));
  const setLeaf = (i: number, patch: Partial<ConditionLeaf>) =>
    update({ ...flat, leaves: flat.leaves.map((l, j) => (j === i ? { ...l, ...patch } : l)) });

  return (
    <div className="space-y-2">
      {flat.leaves.length > 1 && (
        <div className="flex items-center gap-2 text-xs text-gray-600">
          تتحقق
          <select
            className="rounded border border-gray-200 px-2 py-1 text-xs"
            value={flat.join}
            disabled={disabled}
            onChange={(e) => update({ ...flat, join: e.target.value as Join })}
          >
            <option value="all">كل الشروط</option>
            <option value="any">أي شرط منها</option>
          </select>
        </div>
      )}
      {flat.leaves.length === 0 && <p className="text-xs text-gray-400">بدون شرط — كل حدث يطابق.</p>}
      {flat.leaves.map((leaf, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2">
          <input
            list="notify-condition-fields"
            dir="ltr"
            className={inputClass}
            placeholder="الحقل"
            value={leaf.field}
            disabled={disabled}
            onChange={(e) => setLeaf(i, { field: e.target.value })}
          />
          <select
            className={inputClass}
            value={leaf.op}
            disabled={disabled}
            onChange={(e) => {
              const op = e.target.value;
              setLeaf(i, { op, value: VALUELESS_OPERATORS.has(op) ? undefined : parseValue(op, valueText(leaf)) });
            }}
          >
            {Object.entries(OPERATOR_LABELS).map(([op, label]) => (
              <option key={op} value={op}>
                {label}
              </option>
            ))}
          </select>
          <input
            className={inputClass}
            placeholder={VALUELESS_OPERATORS.has(leaf.op) ? "—" : LIST_OPERATORS.has(leaf.op) ? "قيم مفصولة بفاصلة" : leaf.op === "older_than" ? "مثل 48 hours" : "القيمة"}
            disabled={disabled || VALUELESS_OPERATORS.has(leaf.op)}
            value={valueText(leaf)}
            onChange={(e) => setLeaf(i, { value: parseValue(leaf.op, e.target.value) })}
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => update({ ...flat, leaves: flat.leaves.filter((_, j) => j !== i) })}
            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
            title="حذف الشرط"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={disabled}
        onClick={() => update({ ...flat, leaves: [...flat.leaves, { field: "", op: "eq", value: "" }] })}
        className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
        إضافة شرط
      </button>
      <datalist id="notify-condition-fields">
        {fields.map((f) => (
          <option key={f} value={f} />
        ))}
      </datalist>
    </div>
  );
}
