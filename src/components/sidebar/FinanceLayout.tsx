import { Outlet, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Calculator,
  BookOpen,
  Vault,
  CreditCard,
  Building2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const FinanceLayout = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, loading } = useAuth();

  const menuItems = [
    {
      title: "المحاسبة",
      icon: Calculator,
      path: "/finance/accounting",
      description: "إدارة الحسابات",
      role: ["Admin", "Finance"],
    },
    {
      title: "مسك الدفاتر",
      icon: BookOpen,
      path: "/finance/bookkeeping",
      description: "تسجيل القيود المالية",
      role: ["Admin", "Finance", "Bookkeeper"],
    },
    {
      title: "الخزينة",
      icon: Vault,
      path: "/finance/treasury",
      description: "إدارة الخزينة",
      role: ["Admin", "Finance", "Treasurer"],
    },
    {
      title: "المدفوعات",
      icon: CreditCard,
      path: "/finance/payments",
      description: "متابعة المدفوعات",
      role: ["Admin", "Finance", "Bookkeeper"],
    },
    {
      title: "الشركة",
      icon: Building2,
      path: "/finance/company",
      description: "بيانات الشركة المالية",
      role: ["Admin", "Finance", "Bookkeeper"],
    },
  ];
  const visibleItems = menuItems.filter((item) => {
    const roles = (item as { role?: string[] }).role;
    if (!roles || loading) return true;
    if (!user || !user.role) return false;
    return roles.includes(user.role);
  });

  const isActivePath = (path: string) => {
    // Exact match for the path
    if (location.pathname === path) {
      return true;
    }

    // For /finance, only activate if on exact path
    if (path === "/finance" && location.pathname !== "/finance") {
      return false;
    }

    // For other paths, check if current path starts with the menu path
    return location.pathname.startsWith(path + "/");
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50">
      {/* Sidebar - Fixed, no scrolling */}
      <aside
        className={`bg-white border-r border-gray-200 flex flex-col fixed right-0 top-16 bottom-0 transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-72"
        }`}
      >
        {/* Header with Collapse Button */}
        <div
          className={`p-6 flex-shrink-0 relative ${
            isCollapsed ? "" : "border-b border-gray-200"
          }`}
        >
          {!isCollapsed && (
            <>
              <h2 className="text-2xl font-bold text-gray-900">المالية</h2>
              <p className="text-sm text-gray-500 mt-1">
                إدارة الشؤون المالية والمحاسبية
              </p>
            </>
          )}

          {/* Collapse Toggle Button */}
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

        {/* Navigation - Scrollable */}
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

      {/* Main Content - Scrollable, offset by sidebar width */}
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

export default FinanceLayout;
