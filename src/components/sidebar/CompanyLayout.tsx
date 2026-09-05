import SidebarLayout from "./SidebarLayout";
import { COMPANY_ITEMS } from "../../config/navigation/company";
import type { NavItem } from "../../config/navigation/types";

const isActivePath = (path: string, pathname: string, items: NavItem[]) => {
  if (pathname === path) return true;

  // For /company, only activate if on exact path or no sub-route
  if (
    path === "/company" &&
    pathname !== "/company" &&
    !pathname.match(/^\/company\/clients\/\d+$/)
  ) {
    return false;
  }

  // For detail pages (numeric ID), don't activate any menu item
  if (pathname.match(/^\/company\/clients\/\d+/)) return false;

  // Another entry is a longer match for this URL — let that one win.
  // Without this, /company/distribute would also highlight while the
  // user is on /company/distribute/batches.
  const moreSpecific = items.some(
    (item) =>
      item.path.length > path.length &&
      (pathname === item.path || pathname.startsWith(item.path + "/")),
  );
  if (moreSpecific) return false;

  return pathname.startsWith(path + "/");
};

const CompanyLayout = () => (
  <SidebarLayout
    title="إدارة الشركة"
    subtitle="إدارة معلومات الشركة والموظفين"
    items={COMPANY_ITEMS.filter((item) => item.showInSidebar !== false)}
    isActivePath={isActivePath}
  />
);

export default CompanyLayout;
