import { useMemo, useState } from "react";
import { Monitor, Search } from "lucide-react";
import LoadingPage from "../../../components/ui/LoadingPage";
import ErrorPage from "../../../components/ui/errorPage";
import GenericTable from "../../../components/tables/table";
import { useUserSessions } from "../../../hooks/settings/useUserSessions";
import { UserSessionsColumns } from "../../../components/tables/columns/UserSessionsColumns";

const UserSessionsPage = () => {
  const { data, isLoading, isError, error } = useUserSessions();
  const [query, setQuery] = useState("");

  const sessions = data ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) =>
      [s.user_name, s.user_email, s.app_label, s.platform_label]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [sessions, query]);

  const onlineCount = sessions.filter((s) => s.is_online).length;

  if (isLoading) return <LoadingPage label="جاري تحميل الجلسات..." />;
  if (isError)
    return <ErrorPage error={(error as Error).message} label="خطأ في تحميل الجلسات" />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Monitor className="w-5 h-5 text-indigo-700" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  جلسات المستخدمين
                </h1>
                <p className="text-xs text-gray-600 mt-0.5">
                  الأجهزة والتطبيقات التي يستخدمها الموظفون
                </p>
              </div>
            </div>

            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              {onlineCount} متصل الآن
            </span>
          </div>

          <div className="mt-3 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث بالاسم أو البريد أو التطبيق..."
              className="w-full rounded-lg border border-gray-200 bg-white px-9 py-2.5 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
          <GenericTable
            data={filtered}
            columns={UserSessionsColumns}
            emptyMessage="لا توجد جلسات مسجلة."
            pageSize={20}
          />
        </div>
      </div>
    </div>
  );
};

export default UserSessionsPage;
