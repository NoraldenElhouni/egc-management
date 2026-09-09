import SidebarLayout from "./SidebarLayout";
import { HR_ITEMS } from "../../config/navigation/hr";

const isActivePath = (path: string, pathname: string) => {
  if (pathname === path) return true;

  // For /hr/employees, only activate if not on the /new page
  if (path === "/hr/employees" && pathname.startsWith("/hr/employees/")) {
    return false;
  }

  return pathname.startsWith(path + "/");
};

const HRLayout = () => (
  <SidebarLayout
    title="الموارد البشرية"
    subtitle="إدارة الموظفين والقوى العاملة"
    items={HR_ITEMS.filter((item) => item.showInSidebar !== false)}
    isActivePath={isActivePath}
  />
);

export default HRLayout;
