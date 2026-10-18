import { Plus, Trash2 } from "lucide-react";
import { RECIPIENT_TYPE_LABELS } from "../../../config/notifications";
import type { RecipientRule, Recipients } from "../../../services/notifications/notifyApi";
import { inputClass, useAdminList } from "./adminQueries";

// A list of recipient rules; the people they resolve to are added together.
// The database resolves them (notify.resolve_rule) and always applies the
// fixed rules after: who the event type may reach, not the person who did
// it, not inactive accounts, not muted, and the gate permission.

const TYPES = Object.keys(RECIPIENT_TYPE_LABELS) as RecipientRule["type"][];

function asList(r: Recipients | null | undefined): RecipientRule[] {
  if (!r) return [];
  return Array.isArray(r) ? r : [r];
}

function blank(type: RecipientRule["type"]): RecipientRule {
  switch (type) {
    case "column":
      return { type, column: "created_by" };
    case "permission":
      return { type, name: "" };
    case "project_role":
      return { type, role_ids: [] };
    case "party":
      return { type, party_type: "vendor", path: "new.vendor_id" };
    case "task_assignees":
    case "task_creator":
      return { type, path: "new.task_id" };
    case "space_manager":
    case "manager_of":
      return { type, path: "new.id" };
    case "user":
      return { type, id: "" };
    default:
      return { type: "watchers" };
  }
}

interface RecipientsBuilderProps {
  value: Recipients | null;
  onChange: (next: Recipients) => void;
  /** Column names of the source row, for "a person in the record". */
  columns: string[];
  disabled?: boolean;
}

export default function RecipientsBuilder({ value, onChange, columns, disabled }: RecipientsBuilderProps) {
  const rules = asList(value);
  const { data: permissions = [] } = useAdminList<{ name: string; description: string; is_project_scoped: boolean }>("permissions");
  const { data: roles = [] } = useAdminList<{ id: string; name: string }>("project_roles");

  const emit = (next: RecipientRule[]) => onChange(next.length === 1 ? next[0] : next);
  const set = (i: number, rule: RecipientRule) => emit(rules.map((r, j) => (j === i ? rule : r)));

  return (
    <div className="space-y-2">
      {rules.length === 0 && <p className="text-xs text-red-600">أضف مستلماً واحداً على الأقل.</p>}
      {rules.map((rule, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-2">
          <div className="flex items-center gap-2">
            <select
              className={inputClass}
              value={rule.type}
              disabled={disabled}
              onChange={(e) => set(i, blank(e.target.value as RecipientRule["type"]))}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {RECIPIENT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={disabled}
              onClick={() => emit(rules.filter((_, j) => j !== i))}
              className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
              title="حذف"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2">
            {rule.type === "column" && (
              <select className={inputClass} disabled={disabled} value={rule.column} onChange={(e) => set(i, { ...rule, column: e.target.value })}>
                {[rule.column, ...columns.filter((c) => c !== rule.column)].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
            {rule.type === "permission" && (
              <select className={inputClass} disabled={disabled} value={rule.name} onChange={(e) => set(i, { ...rule, name: e.target.value })}>
                <option value="">اختر الصلاحية…</option>
                {permissions.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.description} ({p.name}){p.is_project_scoped ? " — حسب المشروع" : ""}
                  </option>
                ))}
              </select>
            )}
            {rule.type === "project_role" && (
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => {
                  const on = rule.role_ids.includes(r.id);
                  return (
                    <label key={r.id} className={`flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${on ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-600"}`}>
                      <input
                        type="checkbox"
                        className="hidden"
                        disabled={disabled}
                        checked={on}
                        onChange={() =>
                          set(i, { ...rule, role_ids: on ? rule.role_ids.filter((x) => x !== r.id) : [...rule.role_ids, r.id] })
                        }
                      />
                      {r.name}
                    </label>
                  );
                })}
              </div>
            )}
            {rule.type === "party" && (
              <div className="grid grid-cols-2 gap-2">
                <select
                  className={inputClass}
                  disabled={disabled}
                  value={rule.party_type}
                  onChange={(e) => set(i, { ...rule, party_type: e.target.value as "vendor" | "contractor" | "client" })}
                >
                  <option value="vendor">المورد</option>
                  <option value="contractor">المقاول</option>
                  <option value="client">العميل</option>
                </select>
                <input dir="ltr" className={inputClass} disabled={disabled} value={rule.path} placeholder="new.vendor_id" onChange={(e) => set(i, { ...rule, path: e.target.value })} />
              </div>
            )}
            {(rule.type === "task_assignees" || rule.type === "task_creator" || rule.type === "space_manager" || rule.type === "manager_of") && (
              <input
                dir="ltr"
                className={inputClass}
                disabled={disabled}
                value={rule.path}
                placeholder="new.task_id"
                onChange={(e) => set(i, { ...rule, path: e.target.value })}
              />
            )}
            {rule.type === "user" && (
              <input dir="ltr" className={inputClass} disabled={disabled} value={rule.id} placeholder="معرّف المستخدم" onChange={(e) => set(i, { ...rule, id: e.target.value })} />
            )}
            {rule.type === "watchers" && <p className="text-xs text-gray-500">من اختار متابعة هذا العنصر أو مشروعه.</p>}
          </div>
        </div>
      ))}
      <button
        type="button"
        disabled={disabled}
        onClick={() => emit([...rules, blank("permission")])}
        className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
        إضافة مستلمين
      </button>
    </div>
  );
}
