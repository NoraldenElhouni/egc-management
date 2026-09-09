import { Users, UserPlus, Package, PackagePlus } from "lucide-react";
import SidebarLayout from "./SidebarLayout";
import type { NavItem } from "../../config/navigation/types";

const menuItems: NavItem[] = [
  {
    label: "المقاولين",
    icon: Users,
    path: "/supply-chain/contractors",
    description: "قائمة المقاولين",
  },
  {
    label: "إضافة مقاول جديد",
    icon: UserPlus,
    path: "/supply-chain/contractors/new",
    description: "تسجيل مقاول جديد",
  },
  {
    label: "توريد المواد",
    icon: Package,
    path: "/supply-chain/vendors",
    description: "قائمة توريد المواد",
  },
  {
    label: "إضافة توريد جديد",
    icon: PackagePlus,
    path: "/supply-chain/vendors/new",
    description: "تسجيل توريد جديد",
  },
];

const isActivePath = (path: string, pathname: string) => {
  if (pathname === path) return true;

  // For list pages, only activate if not on the /new page
  if (
    (path === "/supply-chain/contractors" &&
      pathname.startsWith("/supply-chain/contractors/")) ||
    (path === "/supply-chain/vendors" &&
      pathname.startsWith("/supply-chain/vendors/"))
  ) {
    return false;
  }

  return pathname.startsWith(path + "/");
};

const SupplyChainLayout = () => (
  <SidebarLayout
    title="سلسلة التوريد"
    subtitle="إدارة المقاولين وتوريد المواد"
    items={menuItems}
    isActivePath={isActivePath}
  />
);

export default SupplyChainLayout;
