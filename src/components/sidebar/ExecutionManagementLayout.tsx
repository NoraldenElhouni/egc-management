import SidebarLayout from "./SidebarLayout";
import { EXECUTION_ITEMS } from "../../config/navigation/execution";
import type { NavItem } from "../../config/navigation/types";

const matches = (path: string, pathname: string) =>
  pathname === path || pathname.startsWith(path + "/");

// The default rule would light up BOTH "إدارة المشاريع"
// (/execution-management/projects) and "فرق المشاريع"
// (/execution-management/projects/teams) while the latter is open,
// because the first is a prefix of the second. The more specific item
// wins, same problem CompanyLayout/CRMLayout/HRLayout already solve.
const isActivePath = (path: string, pathname: string, items: NavItem[]) => {
  if (!matches(path, pathname)) return false;
  return !items.some(
    (item) =>
      item.path !== path &&
      item.path.startsWith(path + "/") &&
      matches(item.path, pathname),
  );
};

const ExecutionManagementLayout = () => (
  <SidebarLayout
    // These two read "إدارة علاقات العملاء / إدارة العملاء والتواصل معهم"
    // — the CRM sidebar's title, copy-pasted. This is the Execution
    // Management section.
    title="إدارة التنفيذ"
    subtitle="متابعة تنفيذ المشاريع وفرقها"
    items={EXECUTION_ITEMS.filter((item) => item.showInSidebar !== false)}
    isActivePath={isActivePath}
  />
);

export default ExecutionManagementLayout;
