import SidebarLayout from "./SidebarLayout";
import { HR_ITEMS } from "../../config/navigation/hr";

const isActivePath = (path: string, pathname: string) => {
  if (pathname === path) return true;

  // For /hr/employees and /hr/applicants, only activate the base item on
  // its own path — sub-paths (new/:id) each have their own nav item or none.
  if (
    (path === "/hr/employees" && pathname.startsWith("/hr/employees/")) ||
    (path === "/hr/applicants" && pathname.startsWith("/hr/applicants/"))
  ) {
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
