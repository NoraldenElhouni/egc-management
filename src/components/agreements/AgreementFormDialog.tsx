import { useState } from "react";
import { Plus, Trash2, Undo2 } from "lucide-react";
import Dialog from "../ui/Dialog";
import Button from "../ui/Button";
import { SearchableSelectField } from "../ui/inputs/SearchableSelectField";
import { useContractorsQuery } from "../../hooks/useContractors";
import {
  agreementErrorMessage,
  useCreateAgreement,
  useEditAgreement,
} from "../../hooks/agreements/useAgreements";
import type { AgreementDetail, AgreementItem } from "../../types/agreements.types";
import { currentItems } from "../../utils/agreements/versions";
import { formatCurrency } from "../../utils/helpper";

// =====================================================================
// New agreement / edit agreement — one dialog
// =====================================================================
// Same rules as the field app's form: title, description, item rows
// (description + price, note optional), a general note, a live total.
// Editing never deletes: removing an existing row strikes it through
// (with undo); the server records it as removed in the new version.
// =====================================================================

type Row = {
  key: string;
  id?: string;
  description: string;
  price: string;
  note: string;
  removed: boolean;
  original?: { description: string; price: number; note: string };
};

/** Accepts Arabic-Indic digits and thousands separators as typed. */
export function parseAmount(text: string): number {
  const ascii = text
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/٫/g, ".")
    .replace(/[,،\s]/g, "");
  const n = Number(ascii);
  return Number.isFinite(n) ? n : 0;
}

let keySeq = 0;
const emptyRow = (): Row => ({
  key: `row-${++keySeq}`,
  description: "",
  price: "",
  note: "",
  removed: false,
});

const rowFromItem = (item: AgreementItem): Row => ({
  key: item.id,
  id: item.id,
  description: item.description,
  price: String(item.price),
  note: item.note ?? "",
  removed: false,
  original: { description: item.description, price: Number(item.price), note: item.note ?? "" },
});

const isEdited = (r: Row) =>
  !!r.original &&
  (r.description.trim() !== r.original.description ||
    parseAmount(r.price) !== r.original.price ||
    r.note.trim() !== r.original.note);

const inputClass =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

type Props = {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  /** Present = edit this agreement; absent = create a new one. */
  detail?: AgreementDetail | null;
  onSaved?: (agreementId: string) => void;
};

export default function AgreementFormDialog(props: Props) {
  // Remount on open so the form always starts from the latest data.
  if (!props.isOpen) return null;
  return <AgreementFormDialogBody {...props} />;
}

function AgreementFormDialogBody({ projectId, isOpen, onClose, detail, onSaved }: Props) {
  const isEdit = !!detail;
  const a = detail?.agreement;
  const { data: contractors = [], isLoading: contractorsLoading } = useContractorsQuery();
  const create = useCreateAgreement(projectId);
  const edit = useEditAgreement(a?.id ?? "");

  const [contractorId, setContractorId] = useState(a?.contractor_id ?? "");
  const [title, setTitle] = useState(a?.title ?? "");
  const [description, setDescription] = useState(a?.description ?? "");
  const [note, setNote] = useState(a?.note ?? "");
  const [changeNote, setChangeNote] = useState("");
  const [rows, setRows] = useState<Row[]>(() =>
    detail ? currentItems(detail.items).map(rowFromItem) : [emptyRow()],
  );
  const [error, setError] = useState<string | null>(null);

  const update = (key: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const removeRow = (row: Row) =>
    row.id ? update(row.key, { removed: true }) : setRows((rs) => rs.filter((r) => r.key !== row.key));

  const activeRows = rows.filter((r) => !r.removed);
  const total = activeRows.reduce((sum, r) => sum + parseAmount(r.price), 0);
  const hasChanges =
    !isEdit ||
    title.trim() !== (a?.title ?? "") ||
    description.trim() !== (a?.description ?? "") ||
    note.trim() !== (a?.note ?? "") ||
    rows.some((r) => r.removed || !r.id || isEdited(r));

  const missing = !contractorId
    ? "اختر المقاول"
    : !title.trim()
      ? "اكتب عنوان الاتفاقية"
      : activeRows.length === 0
        ? "أضف بنداً واحداً على الأقل"
        : activeRows.some((r) => !r.description.trim() || parseAmount(r.price) <= 0)
          ? "أكمل وصف وسعر كل بند"
          : !hasChanges
            ? "لم تقم بأي تغيير بعد"
            : null;

  const saving = create.isPending || edit.isPending;

  const handleSave = () => {
    if (missing || saving) return;
    setError(null);
    const values = {
      title,
      description,
      note,
      changeNote,
      items: activeRows.map((r) => ({
        ...(r.id ? { id: r.id } : {}),
        description: r.description,
        price: parseAmount(r.price),
        note: r.note,
      })),
    };
    const onError = (err: unknown) => setError(agreementErrorMessage(err));
    if (a) {
      edit.mutate(values, { onSuccess: () => { onSaved?.(a.id); onClose(); }, onError });
    } else {
      create.mutate(
        { ...values, contractorId },
        { onSuccess: (id) => { onSaved?.(id); onClose(); }, onError },
      );
    }
  };

  // Numbers skip struck-through rows: 1, 2, 3 over what remains.
  const numberOf = new Map(activeRows.map((r, i) => [r.key, i + 1]));

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div dir="rtl" className="space-y-5 max-h-[78vh] overflow-y-auto px-1">
        <h2 className="text-xl font-semibold text-gray-900">
          {isEdit ? "تعديل الاتفاقية" : "اتفاقية جديدة"}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {isEdit ? (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">المقاول</label>
              <div className="px-3 py-2 rounded-lg bg-gray-50 text-sm font-medium">
                {a?.contractor_name ?? "—"}
              </div>
            </div>
          ) : (
            <SearchableSelectField
              id="agreement-contractor"
              label="المقاول *"
              placeholder="ابحث واختر المقاول"
              loading={contractorsLoading}
              options={contractors
                .filter((c) => c.status === "active")
                .map((c) => ({ value: c.id, label: `${c.first_name} ${c.last_name ?? ""}`.trim() }))}
              value={contractorId}
              onChange={setContractorId}
            />
          )}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">عنوان الاتفاقية *</label>
            <input
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: أعمال لياسة الدور الأول"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">الوصف</label>
          <textarea
            className={inputClass}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-800">البنود</h3>
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-2 w-8">#</th>
                  <th className="p-2 text-right">الوصف</th>
                  <th className="p-2 text-right w-36">السعر</th>
                  <th className="p-2 text-right">ملاحظة</th>
                  <th className="p-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  if (row.removed) {
                    return (
                      <tr key={row.key} className="bg-gray-50 text-gray-400">
                        <td className="p-2" />
                        <td className="p-2 line-through">{row.original?.description}</td>
                        <td className="p-2 line-through">{formatCurrency(row.original?.price ?? 0)}</td>
                        <td className="p-2 text-xs">سيُحذف في الإصدار الجديد</td>
                        <td className="p-2">
                          <button
                            type="button"
                            title="تراجع"
                            onClick={() => update(row.key, { removed: false })}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Undo2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  }
                  const edited = isEdited(row);
                  const isNew = isEdit && !row.id;
                  return (
                    <tr
                      key={row.key}
                      className={`border-t border-gray-100 ${edited ? "bg-amber-50" : isNew ? "bg-emerald-50" : ""}`}
                    >
                      <td className="p-2 text-center text-gray-500">{numberOf.get(row.key)}</td>
                      <td className="p-2">
                        <input
                          className={inputClass}
                          value={row.description}
                          onChange={(e) => update(row.key, { description: e.target.value })}
                          placeholder="وصف البند"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          className={inputClass}
                          inputMode="decimal"
                          value={row.price}
                          onChange={(e) => update(row.key, { price: e.target.value })}
                          placeholder="0"
                        />
                        {edited && row.original && parseAmount(row.price) !== row.original.price && (
                          <div className="text-xs text-amber-700 mt-1">
                            كان: {formatCurrency(row.original.price)}
                          </div>
                        )}
                      </td>
                      <td className="p-2">
                        <input
                          className={inputClass}
                          value={row.note}
                          onChange={(e) => update(row.key, { note: e.target.value })}
                          placeholder="اختياري"
                        />
                      </td>
                      <td className="p-2">
                        <button
                          type="button"
                          title="حذف البند"
                          onClick={() => removeRow(row)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={() => setRows((rs) => [...rs, emptyRow()])}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed border-blue-300 text-blue-700 font-medium hover:bg-blue-50 transition"
          >
            <Plus className="w-4 h-4" /> إضافة بند
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">ملاحظة عامة</label>
            <textarea className={inputClass} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          {isEdit && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">سبب التعديل</label>
              <textarea
                className={inputClass}
                rows={2}
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="يظهر للإدارة مع الإصدار الجديد"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3">
          <span className="text-sm font-medium text-gray-600">الإجمالي</span>
          <span className="text-xl font-bold text-blue-800">
            {isEdit && a && a.total !== total && (
              <span className="text-sm text-gray-400 line-through ml-3">{formatCurrency(a.total)}</span>
            )}
            {formatCurrency(total)}
          </span>
        </div>

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-gray-500">{missing ?? ""}</span>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="button" onClick={handleSave} disabled={!!missing} loading={saving}>
              {isEdit ? "حفظ كإصدار جديد" : "حفظ الاتفاقية"}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
