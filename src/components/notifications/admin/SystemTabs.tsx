import { useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, RotateCcw } from "lucide-react";
import GenericTable from "../../tables/table";
import Button from "../../ui/Button";
import ConfirmDialog from "../../ui/ConfirmDialog";
import { CHANNEL_LABELS } from "../../../config/notifications";
import {
  adminAttach,
  adminDetach,
  adminHistory,
  adminSave,
  adminSimulations,
  type AdminKind,
  type ChannelRow,
  type ConfigRow,
  type HistoryRow,
  type SimulationRow,
  type TableInfo,
} from "../../../services/notifications/notifyApi";
import { adminKey, inputClass, useAdminList, useAdminSave, useAdminTables } from "./adminQueries";

const LOCALE = "ar-u-nu-latn";
const when = (iso: string) =>
  new Date(iso).toLocaleString(LOCALE, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

// ---------------------------------------------------------------------
// Watched tables
// ---------------------------------------------------------------------
export function WatchedTablesTab() {
  const { data = [], isPending } = useAdminTables();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<{ table: TableInfo; attach: boolean } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const busiest = useMemo(() => Math.max(1, ...data.map((t) => t.writes)), [data]);

  const columns = useMemo<ColumnDef<TableInfo, unknown>[]>(
    () => [
      { id: "table", accessorFn: (t) => t.table_name, header: "الجدول", cell: ({ row }) => <span dir="ltr" className="text-sm">{row.original.table_name}</span> },
      { id: "rows", accessorFn: (t) => t.rows, header: "السجلات" },
      {
        id: "writes",
        accessorFn: (t) => t.writes,
        header: "عمليات الكتابة",
        cell: ({ row }) => (
          <span className={row.original.writes > busiest * 0.3 ? "font-semibold text-amber-700" : "text-gray-600"}>
            {row.original.writes.toLocaleString(LOCALE)}
            {row.original.writes > busiest * 0.3 ? " — كثير الكتابة" : ""}
          </span>
        ),
      },
      {
        id: "watched",
        accessorFn: (t) => (t.watched ? "مراقب" : "غير مراقب"),
        header: "",
        cell: ({ row }) => (
          <Button
            type="button"
            size="xs"
            variant={row.original.watched ? "secondary" : "primary"}
            onClick={(e) => {
              e.stopPropagation();
              setPending({ table: row.original, attach: !row.original.watched });
            }}
          >
            {row.original.watched ? "إيقاف المراقبة" : "مراقبة"}
          </Button>
        ),
      },
    ],
    [busiest],
  );

  const confirm = async () => {
    if (!pending) return;
    setMessage(null);
    try {
      if (pending.attach) await adminAttach(pending.table.table_name);
      else await adminDetach(pending.table.table_name);
      await queryClient.invalidateQueries({ queryKey: ["notify-admin"] });
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setPending(null);
    }
  };

  return (
    <div>
      <p className="mb-3 text-sm text-gray-500">
        القواعد تعمل على الجداول المراقبة فقط. كل جدول مراقب يضيف عملاً صغيراً على كل عملية كتابة فيه؛ راقب الجداول كثيرة الكتابة بحذر.
      </p>
      {message && <p className="mb-2 text-sm text-red-600">{message}</p>}
      <GenericTable<TableInfo> data={data} columns={columns} enableFiltering showGlobalFilter emptyMessage={isPending ? "جاري التحميل..." : "لا توجد جداول"} />
      <ConfirmDialog
        open={!!pending}
        onCancel={() => setPending(null)}
        onConfirm={confirm}
        title={pending?.attach ? "مراقبة الجدول" : "إيقاف المراقبة"}
        message={
          pending?.attach
            ? `ستتمكن القواعد من العمل على ${pending.table.table_name}.`
            : `لن تعمل أي قاعدة على ${pending?.table.table_name}. أوقف قواعده أولاً.`
        }
      />
    </div>
  );
}

// ---------------------------------------------------------------------
// Shadow-mode records
// ---------------------------------------------------------------------
export function SimulationsTab() {
  const { data = [], isPending } = useQuery({ queryKey: adminKey("simulations"), queryFn: () => adminSimulations(200) });
  const columns = useMemo<ColumnDef<SimulationRow, unknown>[]>(
    () => [
      { id: "at", accessorFn: (s) => when(s.created_at), header: "الوقت" },
      {
        id: "message",
        accessorFn: (s) => `${s.title} ${s.body}`,
        header: "الإشعار الذي كان سيُرسل",
        cell: ({ row }) => (
          <div className="min-w-[14rem]">
            <p className="text-sm font-medium text-gray-900">{row.original.title}</p>
            <p className="text-xs text-gray-500">{row.original.body}</p>
          </div>
        ),
      },
      { id: "to", accessorFn: (s) => s.recipients.filter(Boolean).join("، "), header: "كان سيصل إلى" },
    ],
    [],
  );
  return (
    <div>
      <p className="mb-3 text-sm text-gray-500">
        ما سجّلته القواعد التي في وضع التجربة: من كانت ستصله وما نصّها، دون إرسال أي شيء. فعّل القاعدة حين تبدو صحيحة.
      </p>
      <GenericTable<SimulationRow>
        data={data}
        columns={columns}
        enableFiltering
        showGlobalFilter
        emptyMessage={isPending ? "جاري التحميل..." : "لا توجد قواعد في وضع التجربة حالياً"}
      />
    </div>
  );
}

// ---------------------------------------------------------------------
// Global settings and channels
// ---------------------------------------------------------------------
const CONFIG_LABELS: Record<string, string> = {
  quiet_hours: "ساعات الهدوء الافتراضية",
  friday_push_min_priority: "أقل أولوية تُرسل يوم الجمعة",
  rate_limits: "حد التنبيهات لكل جهاز",
  blast_radius: "حد عدد المستلمين في القاعدة",
  reminder_times: "مواعيد التذكيرات",
  check_run_hour: "ساعة الفحص اليومي",
  retention_days: "مدة الاحتفاظ (أيام)",
  delivery_failure_alert: "تنبيه عند فشل الإرسال",
  weekly_digest_recipients: "مستلمو ملخص الأسبوع",
  timezone: "المنطقة الزمنية",
};

export function SettingsTab() {
  const { data: config = [] } = useAdminList<ConfigRow>("config");
  const { data: channels = [] } = useAdminList<ChannelRow>("channels");
  const saveChannel = useAdminSave("channels");
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white">
        <h3 className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">القنوات</h3>
        {channels.map((c) => (
          <div key={c.key} className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5 last:border-b-0">
            <span className="text-sm text-gray-700">{CHANNEL_LABELS[c.key] ?? c.name_ar}</span>
            {c.key === "email" || c.key === "whatsapp" ? (
              <span className="text-xs text-gray-400">محجوزة — لا يوجد مُرسِل بعد</span>
            ) : c.key === "inapp" ? (
              <span className="text-xs text-gray-400">دائماً</span>
            ) : (
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={c.is_enabled}
                  onChange={(e) =>
                    saveChannel.mutate(
                      { row: { key: c.key, is_enabled: e.target.checked } },
                      { onError: (err) => setMessage((err as Error).message) },
                    )
                  }
                  className="h-4 w-4"
                />
                مفعّلة
              </label>
            )}
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white">
        <h3 className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">إعدادات عامة</h3>
        {config.map((c) => (
          <ConfigRowEditor key={c.key} row={c} onError={setMessage} />
        ))}
      </section>
      {message && <p className="text-sm text-red-600">{message}</p>}
    </div>
  );
}

function ConfigRowEditor({ row, onError }: { row: ConfigRow; onError: (m: string) => void }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState(JSON.stringify(row.value));
  const [saving, setSaving] = useState(false);
  const dirty = text !== JSON.stringify(row.value);

  const save = async () => {
    let value: unknown;
    try {
      value = JSON.parse(text);
    } catch {
      onError(`القيمة غير صحيحة في «${CONFIG_LABELS[row.key] ?? row.key}»`);
      return;
    }
    setSaving(true);
    try {
      await adminSave("config" as AdminKind, { key: row.key, value });
      await queryClient.invalidateQueries({ queryKey: ["notify-admin"] });
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 items-center gap-2 border-b border-gray-100 px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_1.4fr_auto]">
      <div>
        <p className="text-sm font-medium text-gray-800">{CONFIG_LABELS[row.key] ?? row.key}</p>
        {row.description_ar && <p className="text-[11px] text-gray-400">{row.description_ar}</p>}
      </div>
      <input dir="ltr" className={`${inputClass} font-mono text-xs`} value={text} onChange={(e) => setText(e.target.value)} disabled={row.key === "timezone"} />
      <Button type="button" size="xs" disabled={!dirty} loading={saving} onClick={save}>
        حفظ
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------
// Change history (logs.notification_rule) with one-click rollback
// ---------------------------------------------------------------------
const KIND_LABELS: Record<string, string> = {
  event_types: "نوع إشعار",
  watch_rules: "قاعدة",
  enrichments: "بيانات إضافية",
  reminder_rules: "تذكير",
  check_rules: "فحص",
  escalation_levels: "درجة تصعيد",
  config: "إعداد",
  channels: "قناة",
  watched_tables: "جدول مراقب",
  sources: "مصدر",
  deep_links: "رابط",
};

// Restoring = saving the row as it was before the change, through the same
// checked save as the console (columns that do not exist any more are ignored).
const RESTORABLE = new Set(["event_types", "watch_rules", "reminder_rules", "check_rules", "escalation_levels", "config"]);

export function HistoryTab() {
  const queryClient = useQueryClient();
  const { data = [], isPending } = useQuery({ queryKey: adminKey("history"), queryFn: () => adminHistory(null, null, 300) });
  const [restoring, setRestoring] = useState<HistoryRow | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<HistoryRow, unknown>[]>(
    () => [
      { id: "at", accessorFn: (h) => when(h.occurred_at), header: "الوقت" },
      { id: "who", accessorFn: (h) => h.actor_name ?? "النظام", header: "من" },
      { id: "what", accessorFn: (h) => `${h.action_ar} ${KIND_LABELS[h.rule_kind] ?? h.rule_kind}`, header: "الحدث" },
      { id: "name", accessorFn: (h) => h.rule_name ?? h.rule_key, header: "العنصر" },
      {
        id: "restore",
        header: "",
        cell: ({ row }) =>
          RESTORABLE.has(row.original.rule_kind) && row.original.before ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setRestoring(row.original);
              }}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              استرجاع ما قبل التغيير
            </button>
          ) : null,
      },
    ],
    [],
  );

  const restore = async () => {
    if (!restoring?.before) return;
    setMessage(null);
    try {
      await adminSave(restoring.rule_kind as AdminKind, restoring.before, true);
      await queryClient.invalidateQueries({ queryKey: ["notify-admin"] });
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setRestoring(null);
    }
  };

  return (
    <div>
      <p className="mb-3 text-sm text-gray-500">كل تغيير على الإشعارات: من غيّره ومتى، مع إمكانية الرجوع إلى ما كان قبله.</p>
      {message && (
        <p className="mb-2 flex items-center gap-1 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4" />
          {message}
        </p>
      )}
      <GenericTable<HistoryRow> data={data} columns={columns} enableFiltering showGlobalFilter emptyMessage={isPending ? "جاري التحميل..." : "لا توجد تغييرات بعد"} />
      <ConfirmDialog
        open={!!restoring}
        onCancel={() => setRestoring(null)}
        onConfirm={restore}
        title="استرجاع"
        message={`سيعود «${restoring?.rule_name ?? restoring?.rule_key ?? ""}» إلى ما كان عليه قبل هذا التغيير.`}
      />
    </div>
  );
}
