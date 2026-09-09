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
    // Issue #11/#19: converted off the legacy role check. The
    // view_pending_distribution catalogue entry already existed with
    // zero grants; granted to Admin and Manager to match the
    // ["Admin","Manager"] gate this replaces (itself the issue #15
    // reconciliation of a prior ["Manager"] vs ["Admin","Manager"] drift).
    permission: "view_pending_distribution",
  },
];
