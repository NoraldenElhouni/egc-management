// Sidebar.tsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import {
  Menu,
  X,
  Search,
  Folder,
  PlusCircle,
  List,
  ExternalLink,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import LoadingSpinner from "../ui/LoadingSpinner";

type Project = {
  id: number | string;
  name: string;
  serial_number: number;
};

const Sidebar: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false); // mobile drawer
  const [isCollapsed, setIsCollapsed] = useState(false); // desktop collapse
  const location = useLocation();
  const searchRef = useRef<number | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, serial_number")
        .order("serial_number", { ascending: true });
      if (error) throw error;
      setProjects((data ?? []) as Project[]);
    } catch (err: unknown) {
      console.error("Failed to load projects:", err);
      const message = err instanceof Error ? err.message : String(err);
      setError(message || "فشل في تحميل المشاريع");
    } finally {
      setLoading(false);
    }
  }, []);

  // initial load
  useEffect(() => {
    fetchProjects();

    // refetch on window focus to keep sidebar fresh
    const onFocus = () => fetchProjects();
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchProjects]);

  // Debounced search (client-side filter)
  const onSearchChange = (value: string) => {
    setQuery(value);
    if (searchRef.current) {
      window.clearTimeout(searchRef.current);
    }
    searchRef.current = window.setTimeout(() => {
      // we only filter client-side here; if API search needed, replace with server query
      setQuery((v) => v);
    }, 250);
  };

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(query.trim().toLowerCase()) ||
      p.serial_number.toString().includes(query.trim().toLowerCase())
  );

  // Mobile drawer toggle close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Listen for global open/close/toggle events dispatched by Layout header
  useEffect(() => {
    const onOpen = () => setIsOpen(true);
    const onClose = () => setIsOpen(false);
    const onToggle = () => setIsOpen((s) => !s);

    window.addEventListener("open-sidebar", onOpen as EventListener);
    window.addEventListener("close-sidebar", onClose as EventListener);
    window.addEventListener("toggle-sidebar", onToggle as EventListener);

    return () => {
      window.removeEventListener("open-sidebar", onOpen as EventListener);
      window.removeEventListener("close-sidebar", onClose as EventListener);
      window.removeEventListener("toggle-sidebar", onToggle as EventListener);
    };
  }, []);

  return (
    <>
      {/* Mobile top bar (small screens) */}
      <div className="sm:hidden fixed top-2 right-2 z-50" dir="rtl">
        <button
          aria-label={isOpen ? "إغلاق القائمة" : "فتح القائمة"}
          onClick={() => setIsOpen((s) => !s)}
          className="bg-white p-2 rounded-xl shadow-md hover:scale-[1.02] transition-transform"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Drawer overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 sm:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar (desktop) and Drawer (mobile) */}
      <aside
        role="complementary"
        className={`fixed right-0 top-16 bottom-0 z-50 bg-white border-l shadow-sm transform transition-all
          ${isOpen ? "translate-x-0" : "translate-x-full"} sm:translate-x-0 sm:block ${
            isCollapsed ? "w-20" : "w-72"
          }`}
        aria-label="الشريط الجانبي للمشاريع"
        dir="rtl"
      >
        {/* hide-scrollbar: utility to hide scrollbars across browsers for the inner list */}
        <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}.hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}`}</style>

        <div className="h-full overflow-hidden bg-white p-4 flex flex-col gap-3">
          {/* Header / title */}
          <div className="relative flex items-center justify-between">
            {!isCollapsed ? (
              <div>
                <h2 className="text-2xl font-bold text-gray-900">المشاريع</h2>
                <p className="text-sm text-gray-500 mt-1">
                  قائمة المشاريع وإدارتها
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">
                <div className="rounded-lg bg-slate-100 p-2" aria-hidden>
                  المشاريع
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              {!isCollapsed && (
                <Link
                  to="/projects/new"
                  className="inline-flex items-center gap-1 text-xs py-1 px-3 rounded-lg bg-blue-50 hover:bg-blue-100"
                  aria-label="إضافة مشروع جديد"
                  title="إضافة مشروع"
                >
                  <PlusCircle size={16} />
                  إضافة
                </Link>
              )}

              {/* close button for mobile inside panel */}
              <button
                className="sm:hidden p-1 rounded-md hover:bg-slate-100"
                onClick={() => setIsOpen(false)}
                aria-hidden
                title="إغلاق"
              >
                <X size={16} />
              </button>
            </div>

            {/* Collapse Toggle Button */}
            <button
              onClick={() => setIsCollapsed((s) => !s)}
              className={`absolute top-3 left-3 hover:bg-gray-100 rounded-full p-1 transition-all`}
              title={isCollapsed ? "توسيع القائمة" : "طي القائمة"}
            >
              {isCollapsed ? (
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>

          {/* Search (hide when collapsed) */}
          {!isCollapsed && (
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-2 py-2">
              <Search size={16} />
              <input
                type="search"
                aria-label="بحث عن مشروع"
                placeholder="ابحث عن مشروع..."
                value={query}
                onChange={(e) => onSearchChange(e.target.value)}
                className="bg-transparent outline-none text-sm w-full"
              />
            </div>
          )}

          {/* Section title + refresh */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Folder size={16} />
              {!isCollapsed ? "المشاريع" : ""}
            </h3>

            <button
              onClick={fetchProjects}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
              aria-label="تحديث المشاريع"
              title="تحديث"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="16" />
                  {!isCollapsed && "تحديث"}
                </>
              ) : (
                <>
                  <RefreshCcw size={14} />
                  {!isCollapsed && "تحديث"}
                </>
              )}
            </button>
          </div>

          {/* Loading skeletons */}
          {loading && (
            <div className="space-y-2 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 rounded-md bg-slate-100"
                  aria-hidden
                />
              ))}
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="text-xs text-red-500">{error}</div>
          )}

          {/* Projects list */}
          {!loading && !error && (
            <>
              {filtered.length === 0 ? (
                <div className="text-sm text-slate-500 py-2">
                  لا توجد مشاريع تناسب البحث.
                </div>
              ) : (
                <nav
                  className="flex-1 overflow-auto hide-scrollbar"
                  aria-label="قائمة المشاريع"
                >
                  <ul className="space-y-1">
                    {filtered.map((p) => {
                      const to = `/projects/${p.id}`;
                      const active = location.pathname === to;
                      return (
                        <li key={p.id}>
                          <Link
                            to={to}
                            className={`flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors
                              ${active ? "bg-slate-100 font-medium" : "hover:bg-slate-50"}`}
                            aria-current={active ? "page" : undefined}
                            title={p.name}
                          >
                            {!isCollapsed && (
                              <span className="truncate">
                                {p.serial_number}
                              </span>
                            )}
                            <span
                              className={`truncate ${isCollapsed ? "text-center flex-1" : ""}`}
                            >
                              {p.name}
                            </span>
                            {!isCollapsed && (
                              <span className="text-slate-400">
                                <ExternalLink size={14} />
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              )}
            </>
          )}

          {/* Footer actions */}
          <div className="mt-auto pt-3 border-t flex items-center justify-between gap-2">
            <Link
              to="/projects"
              className={`text-xs text-slate-600 hover:underline flex items-center gap-1 ${isCollapsed ? "justify-center w-full" : ""}`}
            >
              <List size={14} />
              {!isCollapsed && "عرض جميع المشاريع"}
            </Link>

            <Link
              to="/projects/new"
              className={`text-xs bg-blue-600 text-white py-1 px-3 rounded-lg hover:bg-blue-700 inline-flex items-center gap-1 ${isCollapsed ? "justify-center w-full" : ""}`}
            >
              <PlusCircle size={14} />
              {!isCollapsed && "جديد"}
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
