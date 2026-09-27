import { UserPlus, Users, ClipboardList, UserSearch } from "lucide-react";
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
  {
    label: "المتقدمين للوظائف",
    icon: UserSearch,
    path: "/hr/applicants",
    description: "إدارة المتقدمين ومقابلاتهم",
    permission: "view_applicants",
  },
  {
    label: "إضافة متقدم جديد",
    icon: ClipboardList,
    path: "/hr/applicants/new",
    description: "تسجيل بيانات متقدم جديد",
    permission: "create_applicant",
  },
];
