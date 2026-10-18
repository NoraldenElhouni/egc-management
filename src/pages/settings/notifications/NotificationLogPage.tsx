import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, Bell, Search, Smartphone, Timer } from "lucide-react";
import GenericTable from "../../../components/tables/table";
import Dialog from "../../../components/ui/Dialog";
import Button from "../../../components/ui/Button";
import KpiCard from "../../../components/ui/KpiCard";
import { FilterDate, FilterSelect, FiltersButton } from "../../../components/tables/filters/FilterControls";
import { CHANNEL_LABELS, DELIVERY_REASON_LABELS, DELIVERY_STATUS_LABELS } from "../../../config/notifications";
import {
  logDeliveries,
  logErrors,
  logStats,
  logUser,
  type DeliveryRow,
  type ErrorRow,
} from "../../../services/notifications/notifyApi";
import { useLogFilterOptions } from "../../../hooks/logs/useActivityLog";

// Phase 7: what was sent, what failed and why, and "why didn't this person
// get it" — behind view_notification_log.

const LOCALE = "ar-u-nu-latn";
const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(LOCALE, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

interface Filters {
  status: string;
  eventKey: string;
  userId: string;
  fromDate: string;
  toDate: string;
}
const EMPTY: Filters = { status: "", eventKey: "", userId: "", fromDate: "", toDate: "" };

const STATUS_STYLE: Record<string, string> = {
  sent: "text-emerald-700",
  failed: "text-red-700",
  skipped: "text-gray-500",
  suppressed: "text-amber-700",
  queued: "text-blue-700",
  sending: "text-blue-700",
};

const dayStart = (d: string) => (d ? new Date(`${d}T00:00:00`).toISOString() : null);
const dayAfter = (d: string) => (d ? new Date(new Date(`${d}T00:00:00`).getTime() + 86400000).toISOString() : null);

const NotificationLogPage = () => {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [traceUser, setTraceUser] = useState<string | null>(null);
  const { data: options } = useLogFilterOptions();

  const stats = useQuery({ queryKey: ["notify-log", "stats"], queryFn: () => logStats(7) });
  const errors = useQuery({ queryKey: ["notify-log", "errors"], queryFn: () => logErrors(50) });
  const rows = useQuery({
    queryKey: ["notify-log", "deliveries", filters],
    queryFn: () =>
      logDeliveries({
        status: filters.status || null,
        eventKey: filters.eventKey || null,
        userId: filters.userId || null,
        from: dayStart(filters.fromDate),
        to: dayAfter(filters.toDate),
        limit: 500,
      }),
  });

  const eventOptions = useMemo(
    () => (stats.data?.by_event ?? []).map((e) => ({ value: e.event_key, label: e.event_name_ar })),
    [stats.data],
  );

  const columns = useMemo<ColumnDef<DeliveryRow, unknown>[]>(
    () => [
      { id: "at", accessorFn: (d) => when(d.created_at), header: "الوقت" },
      {
        id: "to",
        accessorFn: (d) => d.recipient ?? d.recipient_id,
        header: "المستلم",
        cell: ({ row }) => (
          <button
            type="button"
            className="text-sm text-blue-700 hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              setTraceUser(row.original.recipient_id);
            }}
          >
            {row.original.recipient ?? row.original.recipient_id}
          </button>
        ),
      },
      {
        id: "what",
        accessorFn: (d) => `${d.event_name_ar} ${d.title}`,
        header: "الإشعار",
        cell: ({ row }) => (
          <div className="min-w-[12rem]">
            <p className="text-sm text-gray-900">{row.original.title}</p>
            <p className="text-[11px] text-gray-400">{row.original.event_name_ar}</p>
          </div>
        ),
      },
      { id: "channel", accessorFn: (d) => CHANNEL_LABELS[d.channel] ?? d.channel, header: "القناة" },
      {
        id: "status",
        accessorFn: (d) => `${DELIVERY_STATUS_LABELS[d.status]} ${d.reason ? DELIVERY_REASON_LABELS[d.reason] ?? d.reason : ""}`,
        header: "النتيجة",
        cell: ({ row }) => {
          const d = row.original;
          return (
            <div>
              <span className={`text-sm font-medium ${STATUS_STYLE[d.status]}`}>{DELIVERY_STATUS_LABELS[d.status]}</span>
              {d.reason && <p className="text-[11px] text-gray-500">{DELIVERY_REASON_LABELS[d.reason] ?? d.reason}</p>}
              {d.error && <p className="text-[11px] text-red-500">{d.error}</p>}
            </div>
          );
        },
      },
      { id: "sent", accessorFn: (d) => when(d.sent_at), header: "أُرسل" },
      { id: "read", accessorFn: (d) => (d.read_at ? `قُرئ ${when(d.read_at)}` : "لم يُقرأ"), header: "القراءة" },
    ],
    [],
  );

  const s = stats.data;
  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="p-4" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-800">سجل الإشعارات</h1>
      <p className="mb-4 mt-1 text-sm text-gray-500">ما أُرسل وما لم يُرسل ولماذا. اضغط على اسم أي شخص لمعرفة ما وصله وما لم يصله.</p>

      {s && (
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="إشعارات آخر 7 أيام" icon={Bell} tone="indigo" value={String(s.by_event.reduce((a, e) => a + e.notifications, 0))} />
          <KpiCard label="نسبة فشل التنبيهات" icon={AlertTriangle} tone={(s.failure_rate ?? 0) > 2 ? "red" : "green"} value={s.failure_rate === null ? "—" : `${s.failure_rate}%`} />
          <KpiCard label="متوسط زمن الوصول" icon={Timer} tone="blue" value={s.median_push_seconds === null ? "—" : `${Math.round(s.median_push_seconds)} ث`} />
          <KpiCard label="هواتف نشطة" icon={Smartphone} tone="amber" value={String(s.active_devices)} />
        </div>
      )}

      {errors.data && errors.data.length > 0 && (
        <details className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <summary className="flex cursor-pointer items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {errors.data.length} خطأ مسجّل في نظام الإشعارات (العمليات نفسها تمّت) — أبلغ المطوّر
          </summary>
          <ul className="mt-2 space-y-1 text-xs">
            {errors.data.slice(0, 15).map((e: ErrorRow) => (
              <li key={e.id}>
                {when(e.occurred_at)} · {e.source} {e.event_key ? `· ${e.event_key}` : ""}: {e.message}
              </li>
            ))}
          </ul>
        </details>
      )}

      <GenericTable<DeliveryRow>
        data={rows.data ?? []}
        columns={columns}
        enableFiltering
        showGlobalFilter
        emptyMessage={rows.isPending ? "جاري التحميل..." : "لا توجد سجلات مطابقة"}
        searchAdornment={() => <FiltersButton activeCount={activeCount} onClick={() => setFiltersOpen(true)} />}
      />

      <Dialog isOpen={filtersOpen} onClose={() => setFiltersOpen(false)}>
        <div dir="rtl" className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">الفلاتر</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FilterSelect
              id="nl-status"
              label="النتيجة"
              options={Object.entries(DELIVERY_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
              selected={filters.status}
              onSelect={(v) => setFilters({ ...filters, status: v })}
            />
            <FilterSelect id="nl-event" label="نوع الإشعار" options={eventOptions} selected={filters.eventKey} onSelect={(v) => setFilters({ ...filters, eventKey: v })} />
            <FilterSelect
              id="nl-user"
              label="المستلم"
              options={options?.users ?? []}
              selected={filters.userId}
              onSelect={(v) => setFilters({ ...filters, userId: v })}
            />
            <div />
            <FilterDate id="nl-from" label="التاريخ من" value={filters.fromDate} onChange={(v) => setFilters({ ...filters, fromDate: v })} />
            <FilterDate id="nl-to" label="التاريخ إلى" value={filters.toDate} onChange={(v) => setFilters({ ...filters, toDate: v })} />
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

      {traceUser && <UserTraceDialog userId={traceUser} onClose={() => setTraceUser(null)} />}
    </div>
  );
};

function UserTraceDialog({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { data, isPending, isError, error } = useQuery({ queryKey: ["notify-log", "user", userId], queryFn: () => logUser(userId, 14) });
  return (
    <Dialog isOpen onClose={onClose}>
      <div dir="rtl" className="max-h-[75vh] space-y-4 overflow-y-auto pl-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Search className="h-4 w-4" />
          لماذا لم يصله؟ — {data?.user?.name ?? ""}
        </h2>
        {isPending ? (
          <p className="text-sm text-gray-400">جاري التحميل...</p>
        ) : isError ? (
          <p className="text-sm text-red-600">{(error as Error).message}</p>
        ) : data ? (
          <>
            <section>
              <h3 className="mb-1 text-sm font-semibold text-gray-800">الهواتف</h3>
              {data.devices.length === 0 ? (
                <p className="text-sm text-amber-700">لا يوجد هاتف مسجّل — الإشعارات تصل إلى الصندوق فقط.</p>
              ) : (
                <ul className="space-y-1 text-xs text-gray-700">
                  {data.devices.map((d, i) => (
                    <li key={i}>
                      {d.platform} · {d.is_active ? "نشط" : `متوقف (${DELIVERY_REASON_LABELS[d.deactivated_reason ?? ""] ?? d.deactivated_reason ?? ""})`} · آخر
                      ظهور {when(d.last_seen_at)}
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="text-xs text-gray-700">
              <h3 className="mb-1 text-sm font-semibold text-gray-800">اختياراته</h3>
              <p>
                الحساب: {data.user?.status} · أنواع أوقفها:{" "}
                {Object.entries(data.preferences)
                  .filter(([, m]) => m === "off")
                  .map(([c]) => c)
                  .join("، ") || "لا شيء"}{" "}
                · عناصر كتمها: {data.muted.length}
              </p>
            </section>
            <section>
              <h3 className="mb-1 text-sm font-semibold text-gray-800">آخر 14 يوماً</h3>
              {data.notifications.length === 0 ? (
                <p className="text-sm text-gray-500">لم يُنشأ له أي إشعار في هذه المدة.</p>
              ) : (
                <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                  {data.notifications.map((n) => (
                    <li key={n.id} className="px-3 py-2">
                      <div className="flex justify-between gap-2">
                        <span className="text-sm text-gray-900">{n.title}</span>
                        <span className="text-[11px] text-gray-400">{when(n.created_at)}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        {n.deliveries
                          .map(
                            (d) =>
                              `${CHANNEL_LABELS[d.channel] ?? d.channel}: ${DELIVERY_STATUS_LABELS[d.status] ?? d.status}${
                                d.reason ? ` (${DELIVERY_REASON_LABELS[d.reason] ?? d.reason})` : ""
                              }${d.error ? ` — ${d.error}` : ""}`,
                          )
                          .join(" · ")}
                        {n.read_at ? ` · قُرئ ${when(n.read_at)}` : " · لم يُقرأ"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </div>
    </Dialog>
  );
}

export default NotificationLogPage;
