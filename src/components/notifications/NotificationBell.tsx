import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, CheckCheck, X } from "lucide-react";
import NotificationRow from "./NotificationRow";
import {
  isAppFocused,
  useNotificationActions,
  useNotificationFeed,
  useNotificationOpenRoute,
  useNotificationRealtime,
  useUnreadBadge,
  useUnreadCount,
} from "../../hooks/notifications/useNotifications";
import type { NotificationItem } from "../../services/notifications/notifyApi";

// The header bell: unread badge, the latest notifications, and the live
// bridge — a new notification becomes an OS notification while the window
// is in the background, or a small toast while it is in front (decisions.md
// C15: no OS toast for something already on screen).

const TOAST_MS = 6000;

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<NotificationItem | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: unread } = useUnreadCount();
  const feed = useNotificationFeed({ pageSize: 10 });
  const { markRead, markAllRead } = useNotificationActions();
  const latest = feed.data?.pages[0] ?? [];

  useUnreadBadge(unread);

  const openItem = useCallback(
    (item: NotificationItem) => {
      if (!item.read_at) markRead.mutate([item.id]);
      setOpen(false);
      setToast(null);
      navigate(item.link ?? "/notifications");
    },
    [markRead, navigate],
  );

  useNotificationOpenRoute((route) => navigate(route));

  useNotificationRealtime(async (item) => {
    if (await isAppFocused()) {
      setToast(item);
      return;
    }
    const shown = await window.electronAPI?.showNotification?.({
      title: item.title,
      body: item.body,
      route: item.link ?? "/notifications",
    });
    if (!shown) setToast(item);
  });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const count = unread ?? 0;

  return (
    <div className="relative" ref={panelRef} dir="rtl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="الإشعارات"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -left-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-50 w-[380px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">الإشعارات</h3>
            <button
              type="button"
              disabled={count === 0 || markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              تعليم الكل كمقروء
            </button>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {feed.isPending ? (
              <p className="px-4 py-8 text-center text-sm text-gray-400">جاري التحميل...</p>
            ) : feed.isError ? (
              <p className="px-4 py-8 text-center text-sm text-red-600">تعذّر تحميل الإشعارات</p>
            ) : latest.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-400">لا توجد إشعارات</p>
            ) : (
              latest.map((item) => <NotificationRow key={item.id} item={item} onOpen={openItem} compact />)
            )}
          </div>
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-gray-100 py-2.5 text-center text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            عرض كل الإشعارات
          </Link>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 left-5 z-[60] w-[340px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <NotificationRow item={toast} onOpen={openItem} compact />
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="m-2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title="إغلاق"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
