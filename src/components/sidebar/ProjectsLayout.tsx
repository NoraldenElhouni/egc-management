import { FolderKanban, FolderPlus, AlertTriangle } from "lucide-react";
import SidebarLayout from "./SidebarLayout";
import type { NavItem } from "../../config/navigation/types";

const menuItems: NavItem[] = [
  {
    label: "المشاريع",
    icon: FolderKanban,
    path: "/projects",
    description: "قائمة جميع المشاريع",
  },
  {
    label: "إنشاء مشروع جديد",
    icon: FolderPlus,
    path: "/projects/new",
    description: "إضافة مشروع جديد",
  },
  {
    label: "العدادات",
    icon: AlertTriangle,
    path: "/projects/counters",
    description: "متابعة فترات الرصيد السالب",
  },
];

const isActivePath = (path: string, pathname: string) => {
  if (pathname === path) return true;

  // For /projects, only activate if not on a sub-page
  if (
    path === "/projects" &&
    pathname.startsWith("/projects/") &&
    !pathname.match(/^\/projects\/\d+$/)
  ) {
    return false;
  }

  // For detail pages (numeric ID), don't activate any menu item
  if (pathname.match(/^\/projects\/\d+/)) return false;

  return pathname.startsWith(path + "/");
};

const ProjectsLayout = () => (
  <SidebarLayout
    title="المشاريع"
    subtitle="إدارة ومتابعة المشاريع"
    items={menuItems}
    isActivePath={isActivePath}
  />
);

export default ProjectsLayout;
