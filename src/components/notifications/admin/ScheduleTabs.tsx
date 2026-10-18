import { useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import GenericTable from "../../tables/table";
import Dialog from "../../ui/Dialog";
import Button from "../../ui/Button";
import { INTERVAL_OPTIONS, intervalLabel, PRIORITY_LABELS } from "../../../config/notifications";
import type {
  CheckRuleRow,
  Condition,
  EventTypeRow,
  LadderLevelRow,
  Recipients,
  ReminderRuleRow,
  SourceRow,
} from "../../../services/notifications/notifyApi";
import ConditionBuilder from "./ConditionBuilder";
import RecipientsBuilder from "./RecipientsBuilder";
import { inputClass, labelClass, useAdminDelete, useAdminList, useAdminSave, useAdminTables } from "./adminQueries";

// Reminders ("N days before a date"), checks ("something has been stuck
// for too long") and the escalation ladders checks climb.

const LOCALE = "ar-u-nu-latn";
const offsetLabel = (d: number) => (d === 0 ? "يوم الموعد" : d < 0 ? `قبل ${-d} يوم` : `بعد ${d} يوم`);

function useSourceColumns(source: string | undefined) {
  const { data: tables = [] } = useAdminTables(!!source);
  return useMemo(() => {
    if (!source) return [];
    return tables.find((t) => t.table_name === source)?.columns.map((c) => c.name) ?? [];
  }, [tables, source]);
}

function EventSelect({ value, onChange, disabled, classes }: { value: string; onChange: (v: string) => void; disabled?: boolean; classes: string[] }) {
  const { data: eventTypes = [] } = useAdminList<EventTypeRow>("event_types");
  return (
    <select className={inputClass} disabled={disabled} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">اختر…</option>
      {eventTypes
        .filter((e) => classes.includes(e.class))
        .map((e) => (
          <option key={e.key} value={e.key}>
            {e.name_ar}
          </option>
        ))}
    </select>
  );
}

function SourceSelect({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const { data: sources = [] } = useAdminList<SourceRow>("sources");
  return (
    <select className={inputClass} disabled={disabled} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">اختر…</option>
      {sources.map((s) => (
        <option key={s.name} value={s.name}>
          {s.label_ar}
        </option>
      ))}
    </select>
  );
}

function EditorFooter({
  onClose,
  onSave,
  saving,
  onDelete,
  message,
}: {
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  onDelete?: () => void;
  message: string | null;
}) {
  return (
    <>
      {message && <p className="text-sm text-red-600">{message}</p>}
      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        {onDelete ? (
          <button type="button" onClick={onDelete} className="text-sm text-red-600 hover:text-red-700">
            حذف
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="button" size="sm" loading={saving} onClick={onSave}>
            حفظ
          </Button>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------
// Reminders
// ---------------------------------------------------------------------
export function RemindersTab() {
  const { data = [], isPending } = useAdminList<ReminderRuleRow>("reminder_rules");
  const [editing, setEditing] = useState<Partial<ReminderRuleRow> | null>(null);

  const columns = useMemo<ColumnDef<ReminderRuleRow, unknown>[]>(
    () => [
      { id: "name", accessorFn: (r) => r.name_ar, header: "التذكير" },
      { id: "when", accessorFn: (r) => r.offsets.map(offsetLabel).join("، "), header: "متى" },
      { id: "event", accessorFn: (r) => r.event_name_ar ?? r.event_key, header: "الإشعار" },
      { id: "active", accessorFn: (r) => (r.is_active ? "يعمل" : "موقوف"), header: "الحالة" },
    ],
    [],
  );

  return (
    <div>
      <div className="mb-3 flex items-start justify-between gap-4">
        <p className="text-sm text-gray-500">
          قبل الموعد بيوم يصل التذكير الساعة 4 عصراً، وفي باقي الأيام الساعة 8 صباحاً. ما يقع يوم الجمعة يُرسل يوم الخميس.
        </p>
        <Button type="button" size="sm" onClick={() => setEditing({ name_ar: "", source: "", date_column: "", filter: {}, offsets: [-1], event_key: "", recipients: [], is_active: true })}>
          <Plus className="ml-1 h-4 w-4" />
          تذكير جديد
        </Button>
      </div>
      <GenericTable<ReminderRuleRow>
        data={data}
        columns={columns}
        enableFiltering
        showGlobalFilter
        onRowClick={setEditing}
        emptyMessage={isPending ? "جاري التحميل..." : "لا توجد تذكيرات"}
      />
      {editing && <ReminderEditor initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function ReminderEditor({ initial, onClose }: { initial: Partial<ReminderRuleRow>; onClose: () => void }) {
  const [draft, setDraft] = useState(initial);
  const [offsetsText, setOffsetsText] = useState((initial.offsets ?? []).join(", "));
  const [message, setMessage] = useState<string | null>(null);
  const save = useAdminSave("reminder_rules");
  const remove = useAdminDelete("reminder_rules");
  const columns = useSourceColumns(draft.source);
  const isSystem = !!initial.is_system;
  const set = <K extends keyof ReminderRuleRow>(k: K, v: ReminderRuleRow[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const submit = async () => {
    setMessage(null);
    const offsets = offsetsText
      .split(/[،,\s]+/)
      .filter(Boolean)
      .map(Number);
    if (offsets.length === 0 || offsets.some((n) => !Number.isInteger(n))) {
      setMessage("الأيام أرقام صحيحة، مثل: -3, -1, 0");
      return;
    }
    try {
      await save.mutateAsync({ row: { ...draft, offsets } as Record<string, unknown> });
      onClose();
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  return (
    <Dialog isOpen onClose={onClose}>
      <div dir="rtl" className="max-h-[78vh] space-y-4 overflow-y-auto pl-1">
        <h2 className="text-lg font-semibold text-gray-900">{initial.id ? draft.name_ar : "تذكير جديد"}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className={labelClass}>الاسم</span>
            <input className={inputClass} value={draft.name_ar ?? ""} onChange={(e) => set("name_ar", e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>المصدر</span>
            <SourceSelect value={draft.source ?? ""} disabled={isSystem} onChange={(v) => set("source", v)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>عمود التاريخ</span>
            <select className={inputClass} disabled={isSystem} value={draft.date_column ?? ""} onChange={(e) => set("date_column", e.target.value)}>
              <option value="">اختر…</option>
              {columns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>الأيام (سالب = قبل الموعد)</span>
            <input dir="ltr" className={inputClass} value={offsetsText} onChange={(e) => setOffsetsText(e.target.value)} placeholder="-3, -1, 0" />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>الإشعار</span>
            <EventSelect value={draft.event_key ?? ""} disabled={isSystem} onChange={(v) => set("event_key", v)} classes={["reminder"]} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.is_active ?? true} onChange={(e) => set("is_active", e.target.checked)} className="h-4 w-4" />
            يعمل
          </label>
        </div>
        <section className="space-y-2">
          <p className={labelClass}>فقط السجلات التي</p>
          <ConditionBuilder value={(draft.filter ?? {}) as Condition} onChange={(c) => set("filter", c)} fields={columns} />
        </section>
        <section className="space-y-2">
          <p className={labelClass}>من يستلم</p>
          <RecipientsBuilder value={(draft.recipients ?? []) as Recipients} onChange={(r) => set("recipients", r)} columns={columns} />
        </section>
        <EditorFooter
          onClose={onClose}
          onSave={submit}
          saving={save.isPending}
          message={message}
          onDelete={
            initial.id && !isSystem
              ? async () => {
                  try {
                    await remove.mutateAsync(initial.id as string);
                    onClose();
                  } catch (err) {
                    setMessage((err as Error).message);
                  }
                }
              : undefined
          }
        />
      </div>
    </Dialog>
  );
}

// ---------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------
export function ChecksTab() {
  const { data = [], isPending } = useAdminList<CheckRuleRow>("check_rules");
  const [editing, setEditing] = useState<Partial<CheckRuleRow> | null>(null);

  const columns = useMemo<ColumnDef<CheckRuleRow, unknown>[]>(
    () => [
      { id: "name", accessorFn: (r) => r.name_ar, header: "الفحص" },
      {
        id: "threshold",
        accessorFn: (r) => (r.age_days_column ? "حسب عدد الأيام" : `بعد ${intervalLabel(r.threshold)}`),
        header: "متى يُعتبر متأخراً",
      },
      { id: "schedule", accessorFn: (r) => (r.schedule === "hourly" ? "كل ساعة" : "يومياً 8 صباحاً"), header: "يُفحص" },
      { id: "open", accessorFn: (r) => r.open_count ?? 0, header: "حالات قائمة" },
      {
        id: "last",
        accessorFn: (r) =>
          r.last_run_at ? new Date(r.last_run_at).toLocaleString(LOCALE, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "لم يعمل بعد",
        header: "آخر فحص",
      },
      { id: "active", accessorFn: (r) => (r.is_active ? "يعمل" : "موقوف"), header: "الحالة" },
    ],
    [],
  );

  return (
    <div>
      <div className="mb-3 flex items-start justify-between gap-4">
        <p className="text-sm text-gray-500">
          الفحص يبحث عن ما بقي عالقاً، ويصعّد على السلم بدل التكرار. أول تشغيل لفحص جديد يسجّل الحالات القائمة دون تنبيه، ويرسل ملخصاً واحداً.
        </p>
        <Button
          type="button"
          size="sm"
          onClick={() =>
            setEditing({ name_ar: "", source: "", filter: {}, age_column: "created_at", age_days_column: null, threshold: "48 hours", schedule: "daily", event_key: "", ladder: "", is_active: true })
          }
        >
          <Plus className="ml-1 h-4 w-4" />
          فحص جديد
        </Button>
      </div>
      <GenericTable<CheckRuleRow>
        data={data}
        columns={columns}
        enableFiltering
        showGlobalFilter
        onRowClick={setEditing}
        emptyMessage={isPending ? "جاري التحميل..." : "لا توجد فحوصات"}
      />
      {editing && <CheckEditor initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function CheckEditor({ initial, onClose }: { initial: Partial<CheckRuleRow>; onClose: () => void }) {
  const [draft, setDraft] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const save = useAdminSave("check_rules");
  const remove = useAdminDelete("check_rules");
  const { data: ladders = [] } = useAdminList<LadderLevelRow>("escalation_levels");
  const columns = useSourceColumns(draft.source);
  const { data: tables = [] } = useAdminTables(!!draft.source);
  const columnType = (name: string) =>
    tables.find((t) => t.table_name === draft.source)?.columns.find((c) => c.name === name)?.type ?? "";
  const isSystem = !!initial.is_system;
  const ladderNames = useMemo(() => [...new Set(ladders.map((l) => l.ladder))].sort(), [ladders]);
  const set = <K extends keyof CheckRuleRow>(k: K, v: CheckRuleRow[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const submit = async () => {
    setMessage(null);
    try {
      await save.mutateAsync({ row: draft as Record<string, unknown> });
      onClose();
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  return (
    <Dialog isOpen onClose={onClose}>
      <div dir="rtl" className="max-h-[78vh] space-y-4 overflow-y-auto pl-1">
        <h2 className="text-lg font-semibold text-gray-900">{initial.id ? draft.name_ar : "فحص جديد"}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className={labelClass}>الاسم</span>
            <input className={inputClass} value={draft.name_ar ?? ""} onChange={(e) => set("name_ar", e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>المصدر</span>
            <SourceSelect value={draft.source ?? ""} disabled={isSystem} onChange={(v) => set("source", v)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>يُحسب العمر من</span>
            <select
              className={inputClass}
              disabled={isSystem}
              value={draft.age_column ?? draft.age_days_column ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                // a number of days (days_in_minus) vs a date/time to measure from
                const isDays = /int|numeric/.test(columnType(v));
                setDraft((d) => ({ ...d, age_column: isDays ? null : v, age_days_column: isDays ? v : null }));
              }}
            >
              <option value="">اختر…</option>
              {columns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>يُعتبر متأخراً بعد</span>
            <select className={inputClass} value={draft.threshold ?? "0"} onChange={(e) => set("threshold", e.target.value)}>
              {[draft.threshold ?? "0", ...INTERVAL_OPTIONS.map((o) => o.value).filter((v) => v !== draft.threshold)].map((v) => (
                <option key={v} value={v}>
                  {intervalLabel(v)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>يُفحص</span>
            <select className={inputClass} value={draft.schedule ?? "daily"} onChange={(e) => set("schedule", e.target.value as CheckRuleRow["schedule"])}>
              <option value="hourly">كل ساعة (6 صباحاً – 8 مساءً)</option>
              <option value="daily">يومياً 8 صباحاً</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>الإشعار</span>
            <EventSelect value={draft.event_key ?? ""} disabled={isSystem} onChange={(v) => set("event_key", v)} classes={["check"]} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>سلم التصعيد</span>
            <select className={inputClass} value={draft.ladder ?? ""} onChange={(e) => set("ladder", e.target.value)}>
              <option value="">اختر…</option>
              {ladderNames.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.is_active ?? true} onChange={(e) => set("is_active", e.target.checked)} className="h-4 w-4" />
            يعمل
          </label>
        </div>
        <section className="space-y-2">
          <p className={labelClass}>الحالة السيئة: السجلات التي</p>
          <ConditionBuilder value={(draft.filter ?? {}) as Condition} onChange={(c) => set("filter", c)} fields={columns} />
        </section>
        <section className="space-y-2">
          <p className={labelClass}>عند أول تشغيل، يصل ملخص الحالات القائمة إلى (اختياري)</p>
          <RecipientsBuilder
            value={(draft.baseline_summary_recipients ?? []) as Recipients}
            onChange={(r) => set("baseline_summary_recipients", r)}
            columns={columns}
          />
        </section>
        <EditorFooter
          onClose={onClose}
          onSave={submit}
          saving={save.isPending}
          message={message}
          onDelete={
            initial.id && !isSystem
              ? async () => {
                  try {
                    await remove.mutateAsync(initial.id as string);
                    onClose();
                  } catch (err) {
                    setMessage((err as Error).message);
                  }
                }
              : undefined
          }
        />
      </div>
    </Dialog>
  );
}

// ---------------------------------------------------------------------
// Escalation ladders
// ---------------------------------------------------------------------
export function LaddersTab() {
  const { data = [], isPending } = useAdminList<LadderLevelRow>("escalation_levels");
  const [editing, setEditing] = useState<Partial<LadderLevelRow> | null>(null);
  const ladders = useMemo(() => {
    const m = new Map<string, LadderLevelRow[]>();
    for (const l of data) m.set(l.ladder, [...(m.get(l.ladder) ?? []), l]);
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-gray-500">
          كل درجة تضيف أشخاصاً ولا تحذف من قبلها. درجة لا تصل لأحد تُتخطى. «بعد» تُحسب من لحظة اعتبار الحالة متأخرة.
        </p>
        <Button type="button" size="sm" onClick={() => setEditing({ ladder: "", level: 1, after: "0", recipients: [], priority: null })}>
          <Plus className="ml-1 h-4 w-4" />
          سلم أو درجة جديدة
        </Button>
      </div>
      {isPending && <p className="text-sm text-gray-400">جاري التحميل...</p>}
      {ladders.map(([name, levels]) => (
        <div key={name} className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
            <h3 dir="ltr" className="text-sm font-semibold text-gray-800">{name}</h3>
            <button
              type="button"
              onClick={() => setEditing({ ladder: name, level: Math.max(...levels.map((l) => l.level)) + 1, after: "7 days", recipients: [], priority: null })}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              إضافة درجة
            </button>
          </div>
          {levels
            .sort((a, b) => a.level - b.level)
            .map((l) => (
              <button
                key={l.level}
                type="button"
                onClick={() => setEditing(l)}
                className="flex w-full items-center gap-4 border-b border-gray-100 px-4 py-2.5 text-right last:border-b-0 hover:bg-gray-50"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">{l.level}</span>
                <span className="w-24 text-xs text-gray-500">بعد {intervalLabel(l.after)}</span>
                <span className="flex-1 text-xs text-gray-700">{describeRecipients(l.recipients)}</span>
                {l.priority && <span className="text-xs text-gray-400">{PRIORITY_LABELS[l.priority]}</span>}
              </button>
            ))}
        </div>
      ))}
      {editing && <LevelEditor initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function describeRecipients(r: Recipients): string {
  const list = Array.isArray(r) ? r : [r];
  return list
    .map((x) => {
      switch (x.type) {
        case "permission":
          return `صلاحية ${x.name}`;
        case "project_role":
          return `${x.role_ids.length} دور في المشروع`;
        case "party":
          return x.party_type === "vendor" ? "المورد" : x.party_type === "contractor" ? "المقاول" : "العميل";
        case "column":
          return `العمود ${x.column}`;
        case "task_assignees":
          return "المكلفون بالمهمة";
        case "task_creator":
          return "منشئ المهمة";
        case "space_manager":
          return "مدير المساحة";
        case "manager_of":
          return "المدير المباشر";
        case "watchers":
          return "المتابعون";
        default:
          return "مستخدم محدد";
      }
    })
    .join(" + ");
}

function LevelEditor({ initial, onClose }: { initial: Partial<LadderLevelRow>; onClose: () => void }) {
  const [draft, setDraft] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const save = useAdminSave("escalation_levels");
  const remove = useAdminDelete("escalation_levels");
  const isNew = !initial.recipients || (Array.isArray(initial.recipients) && initial.recipients.length === 0);
  const set = <K extends keyof LadderLevelRow>(k: K, v: LadderLevelRow[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const submit = async () => {
    setMessage(null);
    try {
      await save.mutateAsync({ row: draft as Record<string, unknown> });
      onClose();
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  return (
    <Dialog isOpen onClose={onClose}>
      <div dir="rtl" className="max-h-[78vh] space-y-4 overflow-y-auto pl-1">
        <h2 className="text-lg font-semibold text-gray-900">درجة تصعيد</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>اسم السلم (إنجليزي)</span>
            <input dir="ltr" className={inputClass} value={draft.ladder ?? ""} disabled={!isNew} onChange={(e) => set("ladder", e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>الدرجة</span>
            <input type="number" min={1} max={10} className={inputClass} value={draft.level ?? 1} disabled={!isNew} onChange={(e) => set("level", Number(e.target.value))} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>بعد</span>
            <select className={inputClass} value={draft.after ?? "0"} onChange={(e) => set("after", e.target.value)}>
              {[draft.after ?? "0", ...INTERVAL_OPTIONS.map((o) => o.value).filter((v) => v !== draft.after)].map((v) => (
                <option key={v} value={v}>
                  {intervalLabel(v)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>الأولوية في هذه الدرجة</span>
            <select className={inputClass} value={draft.priority ?? ""} onChange={(e) => set("priority", (e.target.value || null) as LadderLevelRow["priority"])}>
              <option value="">كما في نوع الإشعار</option>
              {Object.entries(PRIORITY_LABELS)
                .filter(([v]) => v !== "critical")
                .map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <section className="space-y-2">
          <p className={labelClass}>يُضاف في هذه الدرجة</p>
          <RecipientsBuilder value={(draft.recipients ?? []) as Recipients} onChange={(r) => set("recipients", r)} columns={[]} />
        </section>
        <EditorFooter
          onClose={onClose}
          onSave={submit}
          saving={save.isPending}
          message={message}
          onDelete={
            !isNew
              ? async () => {
                  try {
                    await remove.mutateAsync(`${initial.ladder}:${initial.level}`);
                    onClose();
                  } catch (err) {
                    setMessage((err as Error).message);
                  }
                }
              : undefined
          }
        />
      </div>
    </Dialog>
  );
}

