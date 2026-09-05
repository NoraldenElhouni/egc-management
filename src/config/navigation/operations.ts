import { PackageOpen, Paperclip, Settings, Sheet } from "lucide-react";
import type { NavItem } from "./types";

export const OPERATIONS_ITEMS: NavItem[] = [
  {
    label: "الخرائط",
    icon: PackageOpen,
    path: "/operations/maps",
    description: "عرض وإدارة الخرائط",
    permission: "view_operations",
  },
  {
    label: "العقود",
    icon: Sheet,
    path: "/operations/contracts",
    description: "إدارة العقود والملفات",
    permission: "view_operations",
  },
  {
    label: "حصر الكميات",
    icon: Paperclip,
    path: "/operations/boq",
    description: "إدارة حصر الكميات",
    permission: "view_operations",
  },
  {
    label: "الإعدادات",
    icon: Settings,
    path: "/operations/settings",
    description: "إعدادات وحدة التشغيل",
    permission: "view_operations",
  },
];
