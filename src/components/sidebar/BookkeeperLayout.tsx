import React, { useEffect, useRef, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useProjects } from "../../hooks/useProjects";
import {
  Search,
  Folder,
  RefreshCcw,
  List,
  ChevronLeft,
  ChevronRight,
  Star,
} from "lucide-react";

const BookkeeperLayout: React.FC = () => {
  const { projects, loading, error, refresh } = useProjects();
  const [query, setQuery] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const location = useLocation();
  const searchRef = useRef<number | null>(null);

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("favoriteProjects");
      if (raw) {
        const arr: string[] = JSON.parse(raw);
        setFavorites(new Set(arr));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const persistFavorites = (next: Set<string>) => {
    localStorage.setItem("favoriteProjects", JSON.stringify(Array.from(next)));
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      persistFavorites(next);
      return next;
    });
  };

  const isFavorite = (id: string) => favorites.has(id);

  // Debounced search
  const onSearchChange = (value: string) => {
    setQuery(value);
    if (searchRef.current) window.clearTimeout(searchRef.current);
    searchRef.current = window.setTimeout(() => setQuery((v) => v), 200);
  };

  const filtered = projects
    .filter((p) => {
      if (!query.trim()) return true;
      return (
        String(p.serial_number).includes(query.trim()) ||
        p.name.toLowerCase().includes(query.trim().toLowerCase())
      );
    })
    // Sort: favorites first, then by serial_number ascending
    .sort((a, b) => {
      const aFav = isFavorite(a.id);
      const bFav = isFavorite(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      const aSerial = Number(a.serial_number);
      const bSerial = Number(b.serial_number);
      if (isNaN(aSerial) && isNaN(bSerial)) return 0;
      if (isNaN(aSerial)) return 1;
      if (isNaN(bSerial)) return -1;
      return aSerial - bSerial;
    });

  useEffect(() => {
    // collapse state could be persisted here later
  }, [isCollapsed]);

  const isActive = (id: string) => {
    const expectedPaths = [
      `/finance/bookkeeping/projects/${id}`,
      `/projects/${id}`,
    ];

    return expectedPaths.some(
      (p) => location.pathname === p || location.pathname.startsWith(p + "/")
    );
  };

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
                          <button
                            onClick={(e) => toggleFavorite(p.id, e)}
                            aria-label={
                              isFavorite(p.id)
                                ? "إزالة من المفضلة"
                                : "إضافة إلى المفضلة"
                            }
                            className={`transition-colors rounded p-0.5 ${
                              isFavorite(p.id)
                                ? "text-yellow-500"
                                : "text-slate-400 hover:text-slate-600"
                            }`}
                          >
                            <Star
                              className="w-4 h-4"
                              fill={isFavorite(p.id) ? "currentColor" : "none"}
                              strokeWidth={isFavorite(p.id) ? 1.5 : 2}
                            />
                          </button>
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
