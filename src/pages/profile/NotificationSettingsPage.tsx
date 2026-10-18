import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellOff, Moon, Sun } from "lucide-react";
import Button from "../../components/ui/Button";
import { MODE_LABELS } from "../../config/notifications";
import {
  getSettings,
  setPreference,
  setSettings,
  subscribe,
  type DeliveryMode,
  type NotificationSettings,
} from "../../services/notifications/notifyApi";

const SETTINGS_KEY = ["notify", "settings"];
const MODES: DeliveryMode[] = ["immediate", "digest", "off"];
const LOCALE = "ar-u-nu-latn";

const SNOOZE_OPTIONS = [
  { days: 1, label: "يوم" },
  { days: 3, label: "3 أيام" },
  { days: 7, label: "أسبوع" },
];

/** The signed-in user's notification choices (timing-and-cadence.md "Per-user controls"). */
const NotificationSettingsPage = () => {
  const queryClient = useQueryClient();
  const { data, isPending, isError, error } = useQuery({ queryKey: SETTINGS_KEY, queryFn: getSettings });
  const [quiet, setQuiet] = useState<NotificationSettings["quiet"] | null>(null);

  useEffect(() => {
    if (data) setQuiet(data.quiet);
  }, [data]);

  const refresh = (next?: NotificationSettings) => {
    if (next) queryClient.setQueryData(SETTINGS_KEY, next);
    else queryClient.invalidateQueries({ queryKey: SETTINGS_KEY });
  };

  const saveSettings = useMutation({ mutationFn: setSettings, onSuccess: refresh });
  const savePreference = useMutation({
    mutationFn: ({ category, mode }: { category: string; mode: DeliveryMode }) => setPreference(category, mode),
    onSuccess: () => refresh(),
  });
  const unmute = useMutation({
    mutationFn: ({ type, id }: { type: string; id: string }) => subscribe(type, id, null),
    onSuccess: () => refresh(),
  });

  if (isPending) return <p className="p-6 text-sm text-gray-400">جاري التحميل...</p>;
  if (isError) return <p className="p-6 text-sm text-red-600">تعذّر تحميل الإعدادات: {(error as Error).message}</p>;
  if (!data || !quiet) return null;

  const mutedUntil = data.muted_until && new Date(data.muted_until) > new Date() ? new Date(data.muted_until) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">إعدادات الإشعارات</h1>
        <p className="mt-1 text-sm text-gray-500">
          الإشعار يصل دائماً إلى صندوق الإشعارات؛ هذه الإعدادات تتحكم في التنبيه على الهاتف وفي النظام.
        </p>
      </div>

      {/* Per category */}
      <section className="rounded-xl border border-gray-200 bg-white">
        <h2 className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">حسب النوع</h2>
        {data.categories.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400">لا توجد أنواع إشعارات لحسابك</p>
        ) : (
          data.categories.map((c) => (
            <div key={c.key} className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0">
              <div>
                <p className="text-sm font-medium text-gray-800">{c.name_ar}</p>
                {c.has_critical && (
                  <p className="mt-0.5 text-xs text-gray-400">الإشعارات الحرجة في هذا النوع تصل دائماً ولا يمكن إيقافها</p>
                )}
              </div>
              <div className="flex overflow-hidden rounded-lg border border-gray-200">
                {MODES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    disabled={savePreference.isPending}
                    onClick={() => savePreference.mutate({ category: c.key, mode: m })}
                    className={`px-3 py-1.5 text-xs transition ${
                      c.mode === m ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {MODE_LABELS[m]}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {/* Quiet hours */}
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">ساعات الهدوء</h2>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={quiet.enabled}
              onChange={(e) => setQuiet({ ...quiet, enabled: e.target.checked })}
              className="h-4 w-4"
            />
            مفعّلة
          </label>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          خلال هذه الساعات يصل الإشعار إلى الصندوق ويؤجَّل التنبيه إلى نهايتها. يوم الجمعة لا يصل إلا المهم. الإشعارات الحرجة تصل دائماً.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            من
            <input
              type="time"
              value={quiet.start}
              disabled={!quiet.enabled}
              onChange={(e) => setQuiet({ ...quiet, start: e.target.value })}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:opacity-50"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            إلى
            <input
              type="time"
              value={quiet.end}
              disabled={!quiet.enabled}
              onChange={(e) => setQuiet({ ...quiet, end: e.target.value })}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:opacity-50"
            />
          </label>
          <Button
            type="button"
            size="sm"
            loading={saveSettings.isPending}
            disabled={JSON.stringify(quiet) === JSON.stringify(data.quiet)}
            onClick={() => saveSettings.mutate({ quiet })}
          >
            حفظ
          </Button>
        </div>
      </section>

      {/* Snooze and digest */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <BellOff className="h-4 w-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">إيقاف مؤقت</h2>
          </div>
          {mutedUntil ? (
            <div className="mt-2 space-y-2">
              <p className="text-sm text-gray-700">
                التنبيهات متوقفة حتى {mutedUntil.toLocaleString(LOCALE, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
              </p>
              <Button type="button" variant="secondary" size="sm" onClick={() => saveSettings.mutate({ muted_until: null })}>
                إلغاء الإيقاف
              </Button>
            </div>
          ) : (
            <>
              <p className="mt-1 text-xs text-gray-500">للإجازات: يصل كل شيء إلى الصندوق دون تنبيه، عدا الحرج.</p>
              <div className="mt-3 flex gap-2">
                {SNOOZE_OPTIONS.map((o) => (
                  <button
                    key={o.days}
                    type="button"
                    onClick={() => saveSettings.mutate({ muted_until: new Date(Date.now() + o.days * 86400000).toISOString() })}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 transition hover:bg-gray-50"
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">ملخص الصباح</h2>
            </div>
            <input
              type="checkbox"
              checked={data.digest_morning}
              onChange={(e) => saveSettings.mutate({ digest_morning: e.target.checked })}
              className="h-4 w-4"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">الساعة 7:30 صباحاً: مهام اليوم والمتأخرة وما لم تقرأه.</p>
        </div>
      </section>

      {/* Muted items */}
      {data.muted.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-white">
          <h2 className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">عناصر كتمتها</h2>
          {data.muted.map((m) => (
            <div key={`${m.entity_type}-${m.entity_id}`} className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-2.5 last:border-b-0">
              <span className="text-sm text-gray-700">{m.name ?? m.entity_id}</span>
              <button
                type="button"
                onClick={() => unmute.mutate({ type: m.entity_type, id: m.entity_id })}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                إلغاء الكتم
              </button>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};

export default NotificationSettingsPage;
