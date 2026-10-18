import { useEffect, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import GenericTable from "../../tables/table";
import Dialog from "../../ui/Dialog";
import Button from "../../ui/Button";
import { FilterSelect, FiltersButton } from "../../tables/filters/FilterControls";
import { DB_EVENT_LABELS, RULE_MODE_LABELS } from "../../../config/notifications";
import {
  adminPreview,
  type Condition,
  type EventTypeRow,
  type PreviewResult,
  type Recipients,
  type WatchRuleRow,
  type WatchedTableRow,
} from "../../../services/notifications/notifyApi";
import ConditionBuilder from "./ConditionBuilder";
import RecipientsBuilder from "./RecipientsBuilder";
import { inputClass, labelClass, needsConfirm, useAdminDelete, useAdminList, useAdminSave, useAdminTables } from "./adminQueries";

const MODE_STYLE: Record<string, string> = {
  live: "bg-emerald-50 text-emerald-700",
  shadow: "bg-amber-50 text-amber-700",
  off: "bg-gray-100 text-gray-500",
};

interface Filters {
  table: string;
  mode: string;
}
const EMPTY: Filters = { table: "", mode: "" };

const NEW_RULE: Partial<WatchRuleRow> = {
  name_ar: "",
  source_table: "",
  db_event: "update",
  condition: {},
  event_key: "",
  recipients: [],
  entity_type: null,
  entity_id_path: "id",
  project_path: null,
  dedup_suffix: null,
  mode: "shadow",
  is_system: false,
};

export default function WatchRulesTab() {
  const { data = [], isPending, isError, error } = useAdminList<WatchRuleRow>("watch_rules");
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<WatchRuleRow> | null>(null);

  const rows = useMemo(
    () => data.filter((r) => (!filters.table || r.source_table === filters.table) && (!filters.mode || r.mode === filters.mode)),
    [data, filters],
  );
  const tables = useMemo(() => [...new Set(data.map((r) => r.source_table))].sort(), [data]);

  const columns = useMemo<ColumnDef<WatchRuleRow, unknown>[]>(
    () => [
      {
        id: "name",
        accessorFn: (r) => `${r.name_ar} ${r.event_name_ar ?? r.event_key}`,
        header: "القاعدة",
        cell: ({ row }) => (
          <div className="min-w-[12rem]">
            <p className="text-sm font-medium text-gray-900">{row.original.name_ar}</p>
            <p className="text-[11px] text-gray-400">{row.original.event_name_ar ?? row.original.event_key}</p>
          </div>
        ),
      },
      {
        id: "table",
        accessorFn: (r) => `${r.source_table} ${DB_EVENT_LABELS[r.db_event]}`,
        header: "متى",
        cell: ({ row }) => (
          <div className="text-xs text-gray-600">
            <span dir="ltr">{row.original.source_table}</span>
            <span className="block text-gray-400">{DB_EVENT_LABELS[row.original.db_event]}</span>
          </div>
        ),
      },
      {
        id: "mode",
        accessorFn: (r) => RULE_MODE_LABELS[r.mode],
        header: "الحالة",
        cell: ({ row }) => (
          <span className={`rounded-full px-2 py-0.5 text-xs ${MODE_STYLE[row.original.mode]}`}>{RULE_MODE_LABELS[row.original.mode]}</span>
        ),
      },
      { id: "kind", accessorFn: (r) => (r.is_system ? "أساسية" : "مضافة"), header: "النوع" },
    ],
    [],
  );

  if (isError) return <p className="p-4 text-sm text-red-600">تعذّر التحميل: {(error as Error).message}</p>;
  const activeCount = (filters.table ? 1 : 0) + (filters.mode ? 1 : 0);

  return (
    <div>
      <div className="mb-3 flex items-start justify-between gap-4">
        <p className="text-sm text-gray-500">
          «عند حدوث كذا في جدول كذا، أرسل الإشعار لفلان». القاعدة الجديدة تبدأ في وضع التجربة: تسجّل من كانت ستصله دون إرسال، ثم تُفعَّل.
        </p>
        <Button type="button" size="sm" onClick={() => setEditing({ ...NEW_RULE })}>
          <Plus className="ml-1 h-4 w-4" />
          قاعدة جديدة
        </Button>
      </div>
      <GenericTable<WatchRuleRow>
        data={rows}
        columns={columns}
        enableFiltering
        showGlobalFilter
        onRowClick={(row) => setEditing(row)}
        emptyMessage={isPending ? "جاري التحميل..." : "لا توجد قواعد"}
        searchAdornment={() => <FiltersButton activeCount={activeCount} onClick={() => setFiltersOpen(true)} />}
      />

      <Dialog isOpen={filtersOpen} onClose={() => setFiltersOpen(false)}>
        <div dir="rtl" className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">الفلاتر</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FilterSelect
              id="wr-table"
              label="الجدول"
              options={tables.map((t) => ({ value: t, label: t }))}
              selected={filters.table}
              onSelect={(v) => setFilters({ ...filters, table: v })}
            />
            <FilterSelect
              id="wr-mode"
              label="الحالة"
              options={Object.entries(RULE_MODE_LABELS).map(([value, label]) => ({ value, label }))}
              selected={filters.mode}
              onSelect={(v) => setFilters({ ...filters, mode: v })}
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setFilters(EMPTY)}
              disabled={activeCount === 0}
              className="text-sm font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              مسح الفلاتر
            </button>
            <Button type="button" size="sm" onClick={() => setFiltersOpen(false)}>
              تم
            </Button>
          </div>
        </div>
      </Dialog>

      {editing && <WatchRuleEditor initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function WatchRuleEditor({ initial, onClose }: { initial: Partial<WatchRuleRow>; onClose: () => void }) {
  const [draft, setDraft] = useState<Partial<WatchRuleRow>>(initial);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [sampleId, setSampleId] = useState("");
  const [confirmCount, setConfirmCount] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { data: eventTypes = [] } = useAdminList<EventTypeRow>("event_types");
  const { data: watched = [] } = useAdminList<WatchedTableRow>("watched_tables");
  const { data: tables = [] } = useAdminTables();
  const save = useAdminSave("watch_rules");
  const remove = useAdminDelete("watch_rules");

  const isSystem = !!initial.is_system;
  const columns = useMemo(
    () => tables.find((t) => t.table_name === draft.source_table)?.columns.map((c) => c.name) ?? [],
    [tables, draft.source_table],
  );
  const set = <K extends keyof WatchRuleRow>(key: K, value: WatchRuleRow[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const ready = !!draft.source_table && !!draft.event_key;
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      adminPreview("watch_rules", draft as Record<string, unknown>, sampleId || null)
        .then((p) => {
          setPreview(p);
          setPreviewError(null);
        })
        .catch((err) => {
          setPreview(null);
          setPreviewError((err as Error).message);
        });
    }, 400);
    return () => clearTimeout(t);
  }, [draft, sampleId, ready]);

  const submit = async (confirm = false) => {
    setMessage(null);
    try {
      const result = await save.mutateAsync({ row: draft as Record<string, unknown>, confirm });
      if (needsConfirm(result)) {
        setConfirmCount(result.recipient_count);
        return;
      }
      onClose();
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  return (
    <Dialog isOpen onClose={onClose}>
      <div dir="rtl" className="max-h-[78vh] space-y-4 overflow-y-auto pl-1">
        <h2 className="text-lg font-semibold text-gray-900">{initial.id ? draft.name_ar : "قاعدة جديدة"}</h2>
        {isSystem && (
          <p className="rounded-lg bg-blue-50 p-2 text-xs text-blue-800">
            قاعدة أساسية: يمكن تعديل الاسم والشرط والمستلمين والحالة، أما الجدول والحدث ونوع الإشعار فثابتة.
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className={labelClass}>اسم القاعدة</span>
            <input className={inputClass} value={draft.name_ar ?? ""} onChange={(e) => set("name_ar", e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>الجدول</span>
            <select className={inputClass} disabled={isSystem} value={draft.source_table ?? ""} onChange={(e) => set("source_table", e.target.value)}>
              <option value="">اختر…</option>
              {watched.map((w) => (
                <option key={w.table_name} value={w.table_name}>
                  {w.table_name}
                </option>
              ))}
            </select>
            {watched.length === 0 && <span className="text-[11px] text-gray-400">راقب جدولاً أولاً من تبويب «الجداول المراقبة».</span>}
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>عند</span>
            <select className={inputClass} disabled={isSystem} value={draft.db_event} onChange={(e) => set("db_event", e.target.value as WatchRuleRow["db_event"])}>
              {Object.entries(DB_EVENT_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>نوع الإشعار</span>
            <select className={inputClass} disabled={isSystem} value={draft.event_key ?? ""} onChange={(e) => set("event_key", e.target.value)}>
              <option value="">اختر…</option>
              {eventTypes.map((e) => (
                <option key={e.key} value={e.key}>
                  {e.name_ar}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>الحالة</span>
            <select className={inputClass} value={draft.mode} onChange={(e) => set("mode", e.target.value as WatchRuleRow["mode"])}>
              {Object.entries(RULE_MODE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          {!isSystem && (
            <>
              <label className="flex flex-col gap-1">
                <span className={labelClass}>العمود الذي يحدد المشروع (اختياري)</span>
                <input dir="ltr" list="wr-cols" className={inputClass} value={draft.project_path ?? ""} onChange={(e) => set("project_path", e.target.value || null)} />
              </label>
              <label className="flex flex-col gap-1">
                <span className={labelClass}>نوع العنصر (للرابط والكتم)</span>
                <select className={inputClass} value={draft.entity_type ?? ""} onChange={(e) => set("entity_type", e.target.value || null)}>
                  <option value="">بدون</option>
                  <option value="task">مهمة</option>
                  <option value="shop_order">طلب شراء</option>
                  <option value="contractor_payment">دفعة مقاول</option>
                  <option value="project">مشروع</option>
                  <option value="service_request">طلب عميل</option>
                </select>
              </label>
              <datalist id="wr-cols">
                {columns.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </>
          )}
        </div>

        <section className="space-y-2">
          <p className={labelClass}>الشرط</p>
          <ConditionBuilder
            value={(draft.condition ?? {}) as Condition}
            onChange={(c) => set("condition", c)}
            fields={[...columns, ...columns.map((c) => `old.${c}`)]}
          />
        </section>

        <section className="space-y-2">
          <p className={labelClass}>من يستلم</p>
          <RecipientsBuilder value={(draft.recipients ?? []) as Recipients} onChange={(r) => set("recipients", r)} columns={columns} />
        </section>

        <section className="rounded-lg bg-gray-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className={labelClass}>معاينة على سجل حقيقي</p>
            <input
              dir="ltr"
              className="w-72 rounded border border-gray-200 px-2 py-1 text-xs"
              placeholder="معرّف سجل محدد (اختياري — الأحدث افتراضياً)"
              value={sampleId}
              onChange={(e) => setSampleId(e.target.value.trim())}
            />
          </div>
          {!ready ? (
            <p className="mt-2 text-xs text-gray-400">اختر الجدول ونوع الإشعار لتظهر المعاينة.</p>
          ) : previewError ? (
            <p className="mt-2 text-xs text-red-600">{previewError}</p>
          ) : preview?.empty ? (
            <p className="mt-2 text-xs text-gray-400">الجدول فارغ.</p>
          ) : preview ? (
            <div className="mt-2 space-y-2">
              <p className={`text-xs ${preview.matches ? "text-emerald-700" : "text-amber-700"}`}>
                {preview.matches ? "هذا السجل يطابق الشرط" : "هذا السجل لا يطابق الشرط — المعاينة لو طابق:"}
              </p>
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <p className="text-sm font-semibold text-gray-900">{preview.title}</p>
                <p className="mt-0.5 whitespace-pre-line text-xs text-gray-600">{preview.body}</p>
              </div>
              <p className="text-xs text-gray-600">
                يصل إلى {preview.recipient_count ?? 0}:{" "}
                {(preview.recipients ?? []).map((r) => r.name ?? r.user_id).join("، ") || "لا أحد"}
              </p>
              {preview.note && <p className="text-[11px] text-gray-400">{preview.note}</p>}
            </div>
          ) : null}
        </section>

        {confirmCount !== null && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            هذه القاعدة تصل إلى {confirmCount} شخص في كل مرة. هل أنت متأكد؟
            <div className="mt-2 flex gap-2">
              <Button type="button" size="sm" onClick={() => submit(true)} loading={save.isPending}>
                نعم، احفظ
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => setConfirmCount(null)}>
                تراجع
              </Button>
            </div>
          </div>
        )}
        {message && <p className="text-sm text-red-600">{message}</p>}

        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          {initial.id && !isSystem ? (
            <button
              type="button"
              onClick={async () => {
                try {
                  await remove.mutateAsync(initial.id as string);
                  onClose();
                } catch (err) {
                  setMessage((err as Error).message);
                }
              }}
              className="text-sm text-red-600 hover:text-red-700"
            >
              حذف القاعدة
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="button" size="sm" loading={save.isPending} onClick={() => submit(false)}>
              حفظ
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
