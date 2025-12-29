import { Outlet, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  Users,
  Box,
  ChevronRight,
  ChevronLeft,
  BookText,
  Map,
} from "lucide-react";

const SettingsLayout = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      title: "اداره الادوار",
      icon: Users,
      path: "/settings/roles",
      description: "إدارة  الأدوار والصلاحيات",
    },
    {
      title: "اداره اسماء المصروفات",
      icon: Box,
      path: "/settings/expenses",
      description: "إدارة اسماء المصروفات",
    },
    {
      title: "اداره التخصصات",
      icon: BookText,
      path: "/settings/specializations",
      description: "إدارة التخصصات",
    },
    {
      title: "اداره الخرائط",
      icon: Map,
      path: "/settings/maps",
      description: "إدارة الخرائط",
    },
  ];

  const { user, loading } = useAuth();

  const visibleItems = menuItems.filter((item) => {
    const roles = (item as { role?: string[] }).role;
    if (!roles || loading) return true;
    if (!user || !user.role) return false;
    return roles.includes(user.role);
  });

  const isActivePath = (path: string) => {
    if (location.pathname === path) return true;
    return location.pathname.startsWith(path + "/");
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50">
      <aside
        className={`bg-white border-r border-gray-200 flex flex-col fixed right-0 top-16 bottom-0 transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-72"
        }`}
      >
        <div
          className={`p-6 flex-shrink-0 relative ${
            isCollapsed ? "" : "border-b border-gray-200"
          }`}
        >
          {!isCollapsed && (
            <>
              <h2 className="text-2xl font-bold text-gray-900">الإعدادات</h2>
              <p className="text-sm text-gray-500 mt-1">إدارة إعدادات النظام</p>
            </>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`absolute top-6 hover:bg-gray-100 rounded-full p-2 transition-all ${
              isCollapsed ? "left-1/2 -translate-x-1/2" : "left-4"
            }`}
            title={isCollapsed ? "توسيع القائمة" : "طي القائمة"}
          >
            {isCollapsed ? (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 scrollbar-hide">
          <ul className="space-y-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`
                      flex items-start gap-3 px-4 py-3 rounded-lg transition-all duration-200
                      ${
                        isActive
                          ? "bg-blue-50 text-blue-700 shadow-sm"
                          : "text-gray-700 hover:bg-gray-100"
                      }
                      ${isCollapsed ? "justify-center" : ""}
                    `}
                    title={isCollapsed ? item.title : ""}
                  >
                    <Icon
                      className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        isActive ? "text-blue-600" : "text-gray-400"
                      }`}
                    />
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div
                          className={`font-medium text-sm ${
                            isActive ? "text-blue-900" : "text-gray-900"
                          }`}
                        >
                          {item.title}
                        </div>
                        <div
                          className={`text-xs mt-0.5 ${
                            isActive ? "text-blue-600" : "text-gray-500"
                          }`}
                        >
                          {item.description}
                        </div>
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <main
        className={`flex-1 overflow-y-auto scrollbar-hide transition-all duration-300 ${
          isCollapsed ? "mr-20" : "mr-72"
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default SettingsLayout;
