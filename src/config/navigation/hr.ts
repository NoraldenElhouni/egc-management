import {
  UserPlus,
  Users,
  ClipboardList,
  UserSearch,
  Briefcase,
  FilePlus2,
} from "lucide-react";
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
  {
    label: "طلبات التوظيف",
    icon: Briefcase,
    path: "/hr/job-requests",
    description: "إدارة طلبات فتح الوظائف واستبياناتها",
    permission: "view_job_requests",
  },
  {
    label: "طلب توظيف جديد",
    icon: FilePlus2,
    path: "/hr/job-requests/new",
    description: "تسجيل طلب فتح وظيفة جديدة",
    permission: "manage_job_requests",
  },
];
