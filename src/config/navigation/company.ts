import {
  Book,
  HandCoins,
  LayoutDashboard,
  LayoutGrid,
  Percent,
  PieChart,
} from "lucide-react";
import type { NavItem } from "./types";

export const COMPANY_ITEMS: NavItem[] = [
  {
    label: "القائمة الرئيسية",
    icon: LayoutGrid,
    path: "/company",
    description: "كل شاشات إدارة الشركة في مكان واحد",
    // The page itself doesn't need a card linking to itself.
    showInMenuGrid: false,
  },
  {
    label: "توزيع النسب",
    icon: Percent,
    path: "/company/distribute",
    description: "توزيع نسب الموظفين على المشاريع المختلفة",
    permission: "view_distribution",
  },
  {
    label: "مراجعة النسب",
    icon: Book,
    path: "/company/distribute/batches",
    description: "مراجعة دفعات التوزيع السابقة",
    permission: "view_distribution",
  },
  // Phase 5 — the new screen, alongside the old ones. The two entries
  // above are unchanged and still lead to the existing wizard.
  {
    label: "نسب التوزيع (الجديد)",
    icon: PieChart,
    path: "/company/shares",
    description: "نسب الأشخاص لكل مشروع، مستقلة عن عضوية الفريق",
    permission: "manage_distribution",
  },
  {
    label: "تفاصيل الشركة",
    icon: LayoutDashboard,
    path: "/company/dashboard",
    description: "تفاصيل الشركة",
    permission: "view_distribution",
    // Issue #15: existed only on the menu page — absent from the
    // sidebar entirely.
  },
  {
    label: "الرواتب",
    icon: HandCoins,
    path: "/company/salaries",
    description: "رواتب الموظفين",
    permission: "view_own_salary",
  },
];
