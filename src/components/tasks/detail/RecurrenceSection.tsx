import { useEffect, useState } from "react";
import { Repeat, Trash2 } from "lucide-react";
import {
  useTaskRecurrence,
  type RecurrenceInput,
  type RecurrenceFrequency,
  type RecurrenceCreateMode,
  type MissedRunBehavior,
} from "../../../hooks/tasks/useTaskRecurrence";

const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  daily: "يومي",
  weekly: "أسبوعي",
  monthly: "شهري",
  yearly: "سنوي",
};
const CREATE_MODE_LABELS: Record<RecurrenceCreateMode, string> = {
  on_schedule: "حسب الجدول، حتى لو السابقة لم تُنجز بعد",
  after_completion: "فقط بعد إتمام المهمة السابقة",
};
const MISSED_RUN_LABELS: Record<MissedRunBehavior, string> = {
  backfill: "تعويض الأيام الفائتة",
  skip: "تخطي الأيام الفائتة",
};
const DAY_LABELS = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultForm(): RecurrenceInput {
  return {
    frequency: "daily",
    interval: 1,
    daysOfWeek: null,
    dayOfMonth: null,
    startsOn: todayIso(),
    endsOn: null,
    maxOccurrences: null,
    createMode: "on_schedule",
    missedRunBehavior: "backfill",
  };
}

function describeRule(rule: RecurrenceInput): string {
  const every = rule.interval > 1 ? `كل ${rule.interval}` : "كل";
  let base = "";
  if (rule.frequency === "daily") base = `${every} يوم`;
  else if (rule.frequency === "weekly") {
    const days = (rule.daysOfWeek ?? []).map((d) => DAY_LABELS[d]).join("، ");
    base = `${every} أسبوع${days ? ` (${days})` : ""}`;
  } else if (rule.frequency === "monthly") base = `${every} شهر${rule.dayOfMonth ? ` في يوم ${rule.dayOfMonth}` : ""}`;
  else base = `${every} سنة`;
  return base;
}

export default function RecurrenceSection({ taskId, boardId }: { taskId: string; boardId: string }) {
  const { rule, loading, createRule, updateRule, toggleActive, deleteRule } = useTaskRecurrence(taskId, boardId);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<RecurrenceInput>(defaultForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (rule) {
      setForm({
        frequency: rule.frequency,
        interval: rule.interval,
        daysOfWeek: rule.days_of_week,
        dayOfMonth: rule.day_of_month,
        startsOn: rule.starts_on.slice(0, 10),
        endsOn: rule.ends_on ? rule.ends_on.slice(0, 10) : null,
        maxOccurrences: rule.max_occurrences,
        createMode: rule.create_mode,
        missedRunBehavior: rule.missed_run_behavior,
      });
    }
  }, [rule]);

  if (loading) return null;

  const toggleDay = (day: number) => {
    const current = form.daysOfWeek ?? [];
    setForm({
      ...form,
      daysOfWeek: current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort(),
    });
  };

  const submit = async () => {
    setSaving(true);
    try {
      if (rule) await updateRule(form);
      else await createRule(form);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (!rule && !editing) {
    return (
      <button
        onClick={() => {
          setForm(defaultForm());
          setEditing(true);
        }}
        className="flex items-center gap-1.5 rounded-md border border-dashed border-gray-300 px-2.5 py-1.5 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700"
      >
        <Repeat className="h-3.5 w-3.5" />
        اجعلها مهمة متكررة
      </button>
    );
  }

  if (editing) {
    return (
      <div className="space-y-2 rounded-md border border-gray-200 bg-gray-50/50 p-3 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-0.5 block text-[10px] text-gray-400">التكرار</span>
            <select
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value as RecurrenceFrequency })}
              className="w-full rounded border border-gray-200 px-1.5 py-1 text-xs"
            >
              {(Object.keys(FREQUENCY_LABELS) as RecurrenceFrequency[]).map((f) => (
                <option key={f} value={f}>
                  {FREQUENCY_LABELS[f]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-0.5 block text-[10px] text-gray-400">كل عدد من الفترات</span>
            <input
              type="number"
              min={1}
              value={form.interval}
              onChange={(e) => setForm({ ...form, interval: Math.max(1, Number(e.target.value)) })}
              className="w-full rounded border border-gray-200 px-1.5 py-1 text-xs"
            />
          </label>
        </div>

        {form.frequency === "weekly" && (
          <div>
            <span className="mb-1 block text-[10px] text-gray-400">أيام الأسبوع</span>
            <div className="flex flex-wrap gap-1">
              {DAY_LABELS.map((label, i) => (
                <button
                  key={i}
                  onClick={() => toggleDay(i)}
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    (form.daysOfWeek ?? []).includes(i)
                      ? "bg-primary text-white"
                      : "bg-white text-gray-500 ring-1 ring-gray-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {form.frequency === "monthly" && (
          <label className="block">
            <span className="mb-0.5 block text-[10px] text-gray-400">يوم الشهر</span>
            <input
              type="number"
              min={1}
              max={31}
              value={form.dayOfMonth ?? ""}
              onChange={(e) => setForm({ ...form, dayOfMonth: e.target.value ? Number(e.target.value) : null })}
              className="w-24 rounded border border-gray-200 px-1.5 py-1 text-xs"
            />
          </label>
        )}

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-0.5 block text-[10px] text-gray-400">تبدأ من</span>
            <input
              type="date"
              value={form.startsOn}
              onChange={(e) => setForm({ ...form, startsOn: e.target.value })}
              className="w-full rounded border border-gray-200 px-1.5 py-1 text-xs"
            />
          </label>
          <label className="block">
            <span className="mb-0.5 block text-[10px] text-gray-400">تنتهي في (اختياري)</span>
            <input
              type="date"
              value={form.endsOn ?? ""}
              onChange={(e) => setForm({ ...form, endsOn: e.target.value || null })}
              className="w-full rounded border border-gray-200 px-1.5 py-1 text-xs"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-0.5 block text-[10px] text-gray-400">أقصى عدد تكرارات (اختياري)</span>
          <input
            type="number"
            min={1}
            value={form.maxOccurrences ?? ""}
            onChange={(e) => setForm({ ...form, maxOccurrences: e.target.value ? Number(e.target.value) : null })}
            className="w-24 rounded border border-gray-200 px-1.5 py-1 text-xs"
          />
        </label>

        <label className="block">
          <span className="mb-0.5 block text-[10px] text-gray-400">توقيت إنشاء النسخة التالية</span>
          <select
            value={form.createMode}
            onChange={(e) => setForm({ ...form, createMode: e.target.value as RecurrenceCreateMode })}
            className="w-full rounded border border-gray-200 px-1.5 py-1 text-xs"
          >
            {(Object.keys(CREATE_MODE_LABELS) as RecurrenceCreateMode[]).map((m) => (
              <option key={m} value={m}>
                {CREATE_MODE_LABELS[m]}
              </option>
            ))}
          </select>
        </label>

        {form.createMode === "on_schedule" && (
          <label className="block">
            <span className="mb-0.5 block text-[10px] text-gray-400">عند تفويت التشغيل المجدول</span>
            <select
              value={form.missedRunBehavior}
              onChange={(e) => setForm({ ...form, missedRunBehavior: e.target.value as MissedRunBehavior })}
              className="w-full rounded border border-gray-200 px-1.5 py-1 text-xs"
            >
              {(Object.keys(MISSED_RUN_LABELS) as MissedRunBehavior[]).map((b) => (
                <option key={b} value={b}>
                  {MISSED_RUN_LABELS[b]}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="flex items-center gap-1.5 pt-1">
          <button
            onClick={submit}
            disabled={saving}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            {rule ? "حفظ" : "تفعيل التكرار"}
          </button>
          <button
            onClick={() => {
              setEditing(false);
              if (rule) {
                setForm({
                  frequency: rule.frequency,
                  interval: rule.interval,
                  daysOfWeek: rule.days_of_week,
                  dayOfMonth: rule.day_of_month,
                  startsOn: rule.starts_on.slice(0, 10),
                  endsOn: rule.ends_on ? rule.ends_on.slice(0, 10) : null,
                  maxOccurrences: rule.max_occurrences,
                  createMode: rule.create_mode,
                  missedRunBehavior: rule.missed_run_behavior,
                });
              }
            }}
            className="rounded-md px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
          >
            إلغاء
          </button>
        </div>
      </div>
    );
  }

  if (!rule) return null;

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm">
      <div className="flex items-center gap-2 overflow-hidden">
        <Repeat className={`h-3.5 w-3.5 shrink-0 ${rule.is_active ? "text-primary" : "text-gray-300"}`} />
        <span className={`truncate ${rule.is_active ? "text-gray-700" : "text-gray-400 line-through"}`}>
          {describeRule(form)}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={() => toggleActive(!rule.is_active)}
          className="rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
        >
          {rule.is_active ? "إيقاف" : "تفعيل"}
        </button>
        <button onClick={() => setEditing(true)} className="rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100">
          تعديل
        </button>
        <button
          onClick={() => confirm("حذف قاعدة التكرار؟ لن يتم إنشاء نسخ جديدة بعد ذلك.") && deleteRule()}
          className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
