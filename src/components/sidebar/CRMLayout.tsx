import { Users, UserPlus } from "lucide-react";
import SidebarLayout from "./SidebarLayout";
import type { NavItem } from "../../config/navigation/types";

const menuItems: NavItem[] = [
  {
    label: "العملاء",
    icon: Users,
    path: "/crm",
    description: "قائمة جميع العملاء",
  },
  {
    label: "إضافة عميل جديد",
    icon: UserPlus,
    path: "/crm/clients/new",
    description: "تسجيل عميل جديد",
  },
];

const isActivePath = (path: string, pathname: string) => {
  if (pathname === path) return true;

  // For /crm, only activate if on exact path or no sub-route
  if (
    path === "/crm" &&
    pathname !== "/crm" &&
    !pathname.match(/^\/crm\/clients\/\d+$/)
  ) {
    return false;
  }

  // For detail pages (numeric ID), don't activate any menu item
  if (pathname.match(/^\/crm\/clients\/\d+/)) return false;

  return pathname.startsWith(path + "/");
};

const CRMLayout = () => (
  <SidebarLayout
    title="إدارة علاقات العملاء"
    subtitle="إدارة العملاء والتواصل معهم"
    items={menuItems}
    isActivePath={isActivePath}
  />
);

export default CRMLayout;
