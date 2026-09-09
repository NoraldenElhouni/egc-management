import { Outlet, Link, useLocation } from "react-router-dom";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useSidebar } from "../../contexts/SidebarContext";
import { useVisibleMenuItems } from "../../hooks/permissions/useMenuPermissions";
import type { NavItem } from "../../config/navigation/types";

// =====================================================================
// One chrome, ten sections.
// =====================================================================
// Finance/Settings/Company/Shops/Execution/HR/Operations/CRM/Projects/
// SupplyChain each carried an identical copy of this markup — the fixed
// aside, the collapse button, the nav list, the Outlet — differing only
// in title/subtitle, item list, and (for a few) which item counts as
// "active" when paths overlap (a section home link, a list vs. its
// "/new" route, a numeric detail route). That last bit is still each
// section's own call, so it stays a prop instead of guessed logic here.
//
// BookkeeperLayout is NOT one of these ten — it's a searchable, dynamic
// project list with favorites and no permission gate, not a static
// NavItem menu, so it keeps its own markup.
// =====================================================================

export interface SidebarLayoutProps {
  title: string;
  subtitle: string;
  items: NavItem[];
  /**
   * Which item counts as active for the current pathname. Defaults to
   * exact match or `pathname.startsWith(item.path + "/")`. Override this
   * when the section has overlapping paths — see CompanyLayout, CRMLayout,
   * ProjectsLayout, HRLayout and SupplyChainLayout for the cases that need
   * it (a home link, a list vs. its "/new" route, a numeric detail route).
   * Receives the full `items` list (not permission-filtered) so a rule
   * can check "is there a more specific item that should win instead".
   */
  isActivePath?: (path: string, pathname: string, items: NavItem[]) => boolean;
}

const defaultIsActivePath = (path: string, pathname: string) =>
  pathname === path || pathname.startsWith(path + "/");

const SidebarLayout = ({
  title,
  subtitle,
  items,
  isActivePath = defaultIsActivePath,
}: SidebarLayoutProps) => {
  const location = useLocation();
  const { isCollapsed, toggle } = useSidebar();
  const { visibleItems } = useVisibleMenuItems(items);

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
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            </>
          )}

          {/* Collapse Toggle Button */}
          <button
            onClick={toggle}
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
              const isActive = isActivePath(item.path, location.pathname, items);

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
                    title={isCollapsed ? item.label : ""}
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
                          {item.label}
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

export default SidebarLayout;
