import { useEffect, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Send } from "lucide-react";
import GenericTable from "../../tables/table";
import Dialog from "../../ui/Dialog";
import Button from "../../ui/Button";
import { FilterSelect, FiltersButton } from "../../tables/filters/FilterControls";
import {
  AUDIENCE_LABELS,
  CATEGORY_LABELS,
  CHANNEL_LABELS,
  CLASS_LABELS,
  INTERVAL_OPTIONS,
  intervalLabel,
  PRIORITY_LABELS,
} from "../../../config/notifications";
import { adminPreview, adminTest, type EventTypeRow, type PreviewResult } from "../../../services/notifications/notifyApi";
import { inputClass, labelClass, useAdminList, useAdminSave } from "./adminQueries";

interface Filters {
  category: string;
  cls: string;
  active: string;
}
const EMPTY: Filters = { category: "", cls: "", active: "" };

const SAMPLE = {
  new: { title: "صب الخرسانة", status: "approved", total_price: 12500, payments_number: "17", currency: "LYD", vendor_name: "مخازن الأمل" },
  project: { name: "الواجهة البحرية" },
  task: { title: "صب الخرسانة" },
  vendor: { vendor_name: "مخازن الأمل" },
  actor: { name: "أحمد" },
  payload: { count: 3, days: 4, hours: 26, title: "تذكير", message: "رجاءً حدّثوا الحالة" },
};

export default function EventTypesTab() {
  const { data = [], isPending, isError, error } = useAdminList<EventTypeRow>("event_types");
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editing, setEditing] = useState<EventTypeRow | null>(null);

  const rows = useMemo(
    () =>
      data.filter(
        (e) =>
          (!filters.category || e.category === filters.category) &&
          (!filters.cls || e.class === filters.cls) &&
          (!filters.active || String(e.is_active) === filters.active),
      ),
    [data, filters],
  );

  const columns = useMemo<ColumnDef<EventTypeRow, unknown>[]>(
    () => [
      {
        id: "name",
        accessorFn: (e) => `${e.name_ar} ${e.key}`,
        header: "النوع",
        cell: ({ row }) => (
          <div className="min-w-[12rem]">
            <p className="text-sm font-medium text-gray-900">{row.original.name_ar}</p>
            <p dir="ltr" className="text-right text-[11px] text-gray-400">{row.original.key}</p>
          </div>
        ),
      },
      { id: "category", accessorFn: (e) => CATEGORY_LABELS[e.category] ?? e.category, header: "الفئة" },
      { id: "class", accessorFn: (e) => CLASS_LABELS[e.class], header: "النمط" },
      { id: "priority", accessorFn: (e) => PRIORITY_LABELS[e.priority], header: "الأولوية" },
      { id: "audience", accessorFn: (e) => e.audience.map((a) => AUDIENCE_LABELS[a] ?? a).join("، "), header: "من يستلم" },
      { id: "channels", accessorFn: (e) => e.channels.map((c) => CHANNEL_LABELS[c] ?? c).join(" + "), header: "القنوات" },
      { id: "sent", accessorFn: (e) => e.sent_7d ?? 0, header: "آخر 7 أيام" },
      {
        id: "active",
        accessorFn: (e) => (e.is_active ? "يعمل" : "موقوف"),
        header: "الحالة",
        cell: ({ row }) => (
          <span className={`rounded-full px-2 py-0.5 text-xs ${row.original.is_active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
            {row.original.is_active ? "يعمل" : "موقوف"}
          </span>
        ),
      },
    ],
    [],
  );

  if (isError) return <p className="p-4 text-sm text-red-600">تعذّر التحميل: {(error as Error).message}</p>;

  const activeCount = (filters.category ? 1 : 0) + (filters.cls ? 1 : 0) + (filters.active ? 1 : 0);

  return (
    <div>
      <p className="mb-3 text-sm text-gray-500">
        كل ما يمكن الإشعار به: النص العربي، الأولوية، القنوات، ومن يمكن أن يستلمه. إيقاف نوع يوقفه في كل التطبيقات خلال دقيقة.
      </p>
      <GenericTable<EventTypeRow>
        data={rows}
        columns={columns}
        enableFiltering
        showGlobalFilter
        onRowClick={(row) => setEditing(row)}
        emptyMessage={isPending ? "جاري التحميل..." : "لا توجد أنواع"}
        searchAdornment={() => <FiltersButton activeCount={activeCount} onClick={() => setFiltersOpen(true)} />}
      />

      <Dialog isOpen={filtersOpen} onClose={() => setFiltersOpen(false)}>
        <div dir="rtl" className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">الفلاتر</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FilterSelect
              id="et-category"
              label="الفئة"
              options={Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
              selected={filters.category}
              onSelect={(v) => setFilters({ ...filters, category: v })}
            />
            <FilterSelect
              id="et-class"
              label="النمط"
              options={Object.entries(CLASS_LABELS).map(([value, label]) => ({ value, label }))}
              selected={filters.cls}
              onSelect={(v) => setFilters({ ...filters, cls: v })}
            />
            <FilterSelect
              id="et-active"
              label="الحالة"
              options={[
                { value: "true", label: "يعمل" },
                { value: "false", label: "موقوف" },
              ]}
              selected={filters.active}
              onSelect={(v) => setFilters({ ...filters, active: v })}
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

      {editing && <EventTypeEditor row={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function EventTypeEditor({ row, onClose }: { row: EventTypeRow; onClose: () => void }) {
  const [draft, setDraft] = useState<EventTypeRow>(row);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const save = useAdminSave("event_types");
  const { data: permissions = [] } = useAdminList<{ name: string; description: string }>("permissions");

  // Live preview against sample values, a moment after typing stops.
  useEffect(() => {
    const t = setTimeout(() => {
      adminPreview("event_types", { ...draft, sample: SAMPLE })
        .then(setPreview)
        .catch(() => setPreview(null));
    }, 300);
    return () => clearTimeout(t);
  }, [draft]);

  const set = <K extends keyof EventTypeRow>(key: K, value: EventTypeRow[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const hasPush = draft.channels.includes("push");

  const submit = async () => {
    setMessage(null);
    try {
      await save.mutateAsync({ row: draft as unknown as Record<string, unknown> });
      onClose();
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  const sendTest = async () => {
    setMessage(null);
    try {
      const n = await adminTest(draft.key);
      setMessage(n > 0 ? "أُرسل إشعار تجريبي إليك" : "لم يُرسل — النوع موقوف، أو حسابك ليس ضمن من يستلمه");
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  return (
    <Dialog isOpen onClose={onClose}>
      <div dir="rtl" className="max-h-[75vh] space-y-4 overflow-y-auto pl-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{row.name_ar}</h2>
            <p dir="ltr" className="text-right text-xs text-gray-400">{row.key}</p>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.is_active} onChange={(e) => set("is_active", e.target.checked)} className="h-4 w-4" />
            يعمل
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>الاسم</span>
            <input className={inputClass} value={draft.name_ar} onChange={(e) => set("name_ar", e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>الأولوية</span>
            <select className={inputClass} value={draft.priority} onChange={(e) => set("priority", e.target.value as EventTypeRow["priority"])}>
              {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>لا يتكرر لنفس الشخص خلال</span>
            <select className={inputClass} value={draft.dedup_window} onChange={(e) => set("dedup_window", e.target.value)}>
              {[draft.dedup_window, ...INTERVAL_OPTIONS.map((o) => o.value).filter((v) => v !== draft.dedup_window && v !== "0")].map((v) => (
                <option key={v} value={v}>
                  {intervalLabel(v)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>شرط صلاحية إضافي للموظفين</span>
            <select className={inputClass} value={draft.gate_permission ?? ""} onChange={(e) => set("gate_permission", e.target.value || null)}>
              <option value="">بدون</option>
              {permissions.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.description}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className={labelClass}>القنوات:</span>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">داخل التطبيق (دائماً)</span>
          <label className="flex cursor-pointer items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={hasPush}
              onChange={(e) => set("channels", e.target.checked ? ["inapp", "push"] : ["inapp"])}
              className="h-4 w-4"
            />
            تنبيه على الهاتف
          </label>
          <span className={labelClass}>
            من يستلم: {draft.audience.map((a) => AUDIENCE_LABELS[a] ?? a).join("، ")}
            {row.is_system ? " (ثابت للأنواع الأساسية)" : ""}
          </span>
        </div>

        <div className="space-y-3 rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500">
            القيم بين {"{{ }}"} تُملأ تلقائياً، مثل {"{{project.name}}"} أو {"{{new.total_price | money}}"}. الصيغ:
            money · date_ar · datetime_ar · relative_ar · ar_plural · truncate · user_name · map · text · default.
          </p>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>العنوان</span>
            <input className={inputClass} value={draft.title_template} onChange={(e) => set("title_template", e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>النص</span>
            <textarea className={inputClass} rows={3} value={draft.body_template} onChange={(e) => set("body_template", e.target.value)} />
          </label>
          {draft.group_mode === "transaction" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className={labelClass}>العنوان عند التجميع</span>
                <input className={inputClass} value={draft.group_title_template ?? ""} onChange={(e) => set("group_title_template", e.target.value || null)} />
              </label>
              <label className="flex flex-col gap-1">
                <span className={labelClass}>النص عند التجميع ({"{{count}}"})</span>
                <input className={inputClass} value={draft.group_body_template ?? ""} onChange={(e) => set("group_body_template", e.target.value || null)} />
              </label>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-gray-50 p-3">
          <p className={labelClass}>معاينة بقيم تجريبية</p>
          <div className="mt-2 rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-sm font-semibold text-gray-900">{preview?.title || "—"}</p>
            <p className="mt-0.5 whitespace-pre-line text-xs text-gray-600">{preview?.body || "—"}</p>
          </div>
          {draft.group_mode === "transaction" && preview?.group_body && (
            <div className="mt-2 rounded-lg border border-gray-200 bg-white p-3">
              <p className="text-sm font-semibold text-gray-900">{preview.group_title}</p>
              <p className="mt-0.5 text-xs text-gray-600">{preview.group_body}</p>
            </div>
          )}
        </div>

        {message && <p className="text-sm text-gray-700">{message}</p>}

        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <button type="button" onClick={sendTest} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700">
            <Send className="h-4 w-4" />
            إرسال تجربة إليّ
          </button>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="button" size="sm" loading={save.isPending} onClick={submit}>
              حفظ
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
