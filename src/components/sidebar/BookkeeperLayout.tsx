import React, { useEffect, useRef, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useProjects } from "../../hooks/useProjects";
import {
  Search,
  Folder,
  RefreshCcw,
  ExternalLink,
  List,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const BookkeeperLayout: React.FC = () => {
  const { projects, loading, error, refresh } = useProjects();
  const [query, setQuery] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const searchRef = useRef<number | null>(null);

  // Debounced search
  const onSearchChange = (value: string) => {
    setQuery(value);
    if (searchRef.current) window.clearTimeout(searchRef.current);
    searchRef.current = window.setTimeout(() => setQuery((v) => v), 200);
  };

  const filtered = projects.filter((p) => {
    if (!query.trim()) return true;
    return (
      String(p.serial_number).includes(query.trim()) ||
      p.name.toLowerCase().includes(query.trim().toLowerCase())
    );
  });

  useEffect(() => {
    // collapse state could be persisted here later
  }, [isCollapsed]);

  const isActive = (id: number | string) =>
    location.pathname === `/projects/${id}`;

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50">
      <aside
        className={`bg-white border-r border-gray-200 flex flex-col fixed right-0 top-16 bottom-0 transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-72"
        }`}
      >
        <div
          className={`p-4 relative ${isCollapsed ? "" : "border-b border-gray-200"}`}
        >
          {!isCollapsed ? (
            <>
              <h2 className="text-lg font-semibold">محاسبة - المشاريع</h2>
              <p className="text-sm text-gray-500 mt-1">عرض ومطابقة المشاريع</p>
            </>
          ) : (
            <div className="flex items-center justify-center w-full">ق</div>
          )}

          <button
            onClick={() => setIsCollapsed((s) => !s)}
            className="absolute top-3 left-3 hover:bg-gray-100 rounded-full p-1"
            title={isCollapsed ? "توسيع" : "طي"}
          >
            {isCollapsed ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>

        {!isCollapsed && (
          <div className="p-3">
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-2 py-2">
              <Search size={16} />
              <input
                type="search"
                placeholder="ابحث عن مشروع أو رقم..."
                value={query}
                onChange={(e) => onSearchChange(e.target.value)}
                className="bg-transparent outline-none text-sm w-full"
                aria-label="بحث عن مشروع"
              />
            </div>
          </div>
        )}

        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-gray-500" />
            {!isCollapsed && (
              <span className="text-sm font-medium">المشاريع</span>
            )}
          </div>

          <button
            onClick={refresh}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
            title="تحديث"
          >
            {loading ? (
              <RefreshCcw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCcw className="w-4 h-4" />
            )}
            {!isCollapsed && <span className="text-xs">تحديث</span>}
          </button>
        </div>

        <div className="flex-1 overflow-auto p-2 scrollbar-hide">
          {loading ? (
            <div className="space-y-2 animate-pulse p-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-8 rounded-md bg-slate-100" />
              ))}
            </div>
          ) : error ? (
            <div className="text-xs text-red-500 p-2">
              خطأ في تحميل المشاريع
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-slate-500 p-2">لا توجد مشاريع</div>
          ) : (
            <ul className="space-y-1">
              {filtered.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/finance/bookkeeping/projects/${p.id}`}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive(p.id)
                        ? "bg-blue-50 text-blue-700"
                        : "hover:bg-gray-50 text-gray-800"
                    } ${isCollapsed ? "justify-center" : "justify-between"}`}
                    title={isCollapsed ? String(p.serial_number) : p.name}
                  >
                    {isCollapsed ? (
                      <span className="font-medium">{p.serial_number}</span>
                    ) : (
                      <>
                        <span className="truncate font-medium">{p.name}</span>
                        <div className="flex items-center gap-2 text-slate-400">
                          <span className="text-sm">{p.serial_number}</span>
                          <ExternalLink className="w-4 h-4" />
                        </div>
                      </>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-auto p-3 border-t flex items-center gap-2">
          {!isCollapsed && (
            <Link
              to="/projects"
              className="text-xs text-slate-600 hover:underline flex items-center gap-1"
            >
              <List className="w-4 h-4" />
              عرض الكل
            </Link>
          )}

          <Link
            to="/projects/new"
            className={`ml-auto text-xs bg-blue-600 text-white py-1 px-3 rounded-lg hover:bg-blue-700 inline-flex items-center gap-1 ${
              isCollapsed ? "w-full justify-center" : ""
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            {!isCollapsed && "جديد"}
          </Link>
        </div>
      </aside>

      <main
        className={`flex-1 overflow-y-auto scrollbar-hide transition-all duration-300 ${isCollapsed ? "mr-20" : "mr-72"}`}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default BookkeeperLayout;
