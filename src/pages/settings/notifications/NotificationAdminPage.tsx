import { useSearchParams } from "react-router-dom";
import EventTypesTab from "../../../components/notifications/admin/EventTypesTab";
import WatchRulesTab from "../../../components/notifications/admin/WatchRulesTab";
import { ChecksTab, LaddersTab, RemindersTab } from "../../../components/notifications/admin/ScheduleTabs";
import { HistoryTab, SettingsTab, SimulationsTab, WatchedTablesTab } from "../../../components/notifications/admin/SystemTabs";

// The no-code console (plans/notification-system/dynamic-configuration.md),
// behind manage_notifications. Every change is recorded in
// logs.notification_rule (the history tab) and checked by the database.

const TABS = [
  { id: "types", label: "أنواع الإشعارات", render: () => <EventTypesTab /> },
  { id: "rules", label: "القواعد", render: () => <WatchRulesTab /> },
  { id: "reminders", label: "التذكيرات", render: () => <RemindersTab /> },
  { id: "checks", label: "الفحوصات", render: () => <ChecksTab /> },
  { id: "ladders", label: "سلالم التصعيد", render: () => <LaddersTab /> },
  { id: "tables", label: "الجداول المراقبة", render: () => <WatchedTablesTab /> },
  { id: "shadow", label: "وضع التجربة", render: () => <SimulationsTab /> },
  { id: "settings", label: "الإعدادات", render: () => <SettingsTab /> },
  { id: "history", label: "سجل التغييرات", render: () => <HistoryTab /> },
] as const;

const NotificationAdminPage = () => {
  const [params, setParams] = useSearchParams();
  const active = TABS.find((t) => t.id === params.get("tab")) ?? TABS[0];

  return (
    <div className="p-4" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-800">إدارة الإشعارات</h1>
      <p className="mb-4 mt-1 text-sm text-gray-500">
        ماذا يُرسل، ولمن، ومتى — دون تحديث للتطبيقات. التغييرات تعمل خلال دقيقة وتُسجَّل.
      </p>
      <div className="mb-4 flex flex-wrap gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setParams({ tab: t.id }, { replace: true })}
            className={`-mb-px border-b-2 px-3 py-2 text-sm transition ${
              t.id === active.id ? "border-blue-600 font-semibold text-blue-700" : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {active.render()}
    </div>
  );
};

export default NotificationAdminPage;
