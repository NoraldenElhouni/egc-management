import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCheck, Settings2 } from "lucide-react";
import Button from "../../components/ui/Button";
import NotificationRow from "../../components/notifications/NotificationRow";
import { CATEGORY_LABELS } from "../../config/notifications";
import { useNotificationActions, useNotificationFeed, useUnreadCount } from "../../hooks/notifications/useNotifications";
import type { NotificationItem } from "../../services/notifications/notifyApi";

const CATEGORY_CHIPS = ["tasks", "orders", "contracts", "finance", "client", "hr", "system"];

/** Every notification of the signed-in user, newest first. */
const NotificationsPage = () => {
  const navigate = useNavigate();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const feed = useNotificationFeed({ unreadOnly, category });
  const { data: unread } = useUnreadCount();
  const { markRead, markAllRead, archive } = useNotificationActions();

  const items = useMemo(() => feed.data?.pages.flat() ?? [], [feed.data]);

  const open = (item: NotificationItem) => {
    if (!item.read_at) markRead.mutate([item.id]);
    if (item.link && item.link !== "/notifications") navigate(item.link);
  };

  return (
    <div className="mx-auto max-w-3xl p-4" dir="rtl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">الإشعارات</h1>
          <p className="mt-1 text-sm text-gray-500">
            {unread ? `${unread} غير مقروءة` : "لا توجد إشعارات غير مقروءة"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/profile/notifications"
            className="flex items-center gap-1.5 rounded border px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
          >
            <Settings2 className="h-4 w-4" />
            إعدادات الإشعارات
          </Link>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!unread}
            loading={markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            <CheckCheck className="ml-1 h-4 w-4" />
            تعليم الكل كمقروء
          </Button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {[
          { id: false, label: "الكل" },
          { id: true, label: "غير المقروءة" },
        ].map((t) => (
          <button
            key={String(t.id)}
            type="button"
            onClick={() => setUnreadOnly(t.id)}
            className={`rounded-full px-3 py-1 text-sm transition ${
              unreadOnly === t.id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-gray-200" />
        <button
          type="button"
          onClick={() => setCategory(null)}
          className={`rounded-full px-3 py-1 text-xs transition ${
            category === null ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"
          }`}
        >
          كل الأنواع
        </button>
        {CATEGORY_CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1 text-xs transition ${
              category === c ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {feed.isPending ? (
          <p className="px-4 py-10 text-center text-sm text-gray-400">جاري التحميل...</p>
        ) : feed.isError ? (
          <p className="px-4 py-10 text-center text-sm text-red-600">تعذّر تحميل الإشعارات: {(feed.error as Error).message}</p>
        ) : items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-gray-400">لا توجد إشعارات هنا</p>
        ) : (
          items.map((item) => (
            <NotificationRow key={item.id} item={item} onOpen={open} onArchive={(i) => archive.mutate([i.id])} />
          ))
        )}
      </div>

      {feed.hasNextPage && (
        <div className="mt-4 flex justify-center">
          <Button type="button" variant="secondary" size="sm" loading={feed.isFetchingNextPage} onClick={() => feed.fetchNextPage()}>
            تحميل المزيد
          </Button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
