import {
  BookOpen,
  Building2,
  ClipboardList,
  CreditCard,
  PieChart,
  Vault,
} from "lucide-react";
import type { NavItem } from "./types";

export const FINANCE_ITEMS: NavItem[] = [
  {
    label: "مسك الدفاتر",
    icon: BookOpen,
    path: "/finance/bookkeeping",
    description: "تسجيل القيود المالية",
    permission: "view_bookkeeping",
  },
  {
    label: "الخزينة",
    icon: Vault,
    path: "/finance/treasury",
    description: "إدارة الخزينة",
    permission: "view_treasury",
  },
  {
    label: "الشركة",
    icon: Building2,
    path: "/finance/company",
    description: "بيانات الشركة المالية",
    permission: "view_company_finance",
  },
  {
    label: "اضافة مشاريع",
    icon: Building2,
    path: "/finance/projects/add",
    description: "إضافة مشاريع جديدة",
    permission: "view_projects",
  },
  {
    label: "المدفوعات",
    icon: CreditCard,
    path: "/finance/payments",
    description: "متابعة المدفوعات",
    permission: "view_payments",
  },
  {
    label: "مدفوعات المقاولين والطلبات والعقود",
    icon: ClipboardList,
    path: "/finance/tracking",
    description: "مدفوعات المقاولين، الطلبات، والعقود",
    permission: "view_payments",
  },
  {
    label: "مدفوعات قيد التوزيع",
    icon: PieChart,
    path: "/finance/pending-distribution",
    description: "سجل مدفوعات المصاريف غير الموزعة لكل مشروع",
    // PHASE 7B: deliberately left on a role check — this screen overlaps
    // the undistributed-expenses work that is paused. Issue #15: the
    // menu page and sidebar had drifted to ["Manager"] vs
    // ["Admin","Manager"]; reconciled to the wider set rather than
    // narrowing Admin's access.
    role: ["Admin", "Manager"],
  },
];
