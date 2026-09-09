import { UserPlus, Users } from "lucide-react";
import type { NavItem } from "./types";

export const HR_ITEMS: NavItem[] = [
  {
    label: "الموظفين",
    icon: Users,
    path: "/hr/employees",
    description: "إدارة سجلات الموظفين",
    permission: "view_employees",
  },
  {
    label: "إضافة موظف جديد",
    icon: UserPlus,
    path: "/hr/employees/new",
    description: "تسجيل موظف جديد",
    permission: "create_employee",
  },
];
