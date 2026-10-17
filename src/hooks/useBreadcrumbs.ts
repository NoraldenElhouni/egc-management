import { useQueries } from "@tanstack/react-query";
import { matchPath } from "react-router-dom";
import { BREADCRUMB_ENTITIES } from "../config/navigation/breadcrumbEntities";

export interface Crumb {
  path: string;
  label: string;
  loading: boolean;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Segments that only exist as a prefix for the id after them (there is no
// `/tasks/board` page) — folded into that id's crumb instead of rendered as
// a dead link of their own.
const PREFIX_ONLY = new Set(["board", "space", "task", "department", "project", "expense", "employee"]);

// Simple human-friendly labels for common route segments
export const SEGMENT_NAMES: Record<string, string> = {
  "": "اللوحة الرئيسية",
  dashboard: "لوحة التحكم",
  hr: "الموارد البشرية",
  employees: "الموظفين",
  employee: "الموظف",
  applicants: "المتقدمين للوظائف",
  applicant: "المتقدم",
  "job-requests": "طلبات التوظيف",
  "evaluation-settings": "إعدادات التقييم",
  "question-bank": "بنك الأسئلة",
  crm: "إدارة علاقات العملاء",
  "supply-chain": "سلسلة التوريد",
  projects: "المشاريع",
  project: "المشروع",
  finance: "المالية",
  profile: "الملف الشخصي",
  settings: "الإعدادات",
  tasks: "المهام",
  board: "لوحة",
  gantt: "مخطط جانت",
  flow: "مخطط الروابط",
  department: "قسم",
  "my-work": "أعمالي",
  "by-assignee": "حسب الموظف",
  "by-type": "حسب نوع المهمة",
  "by-project": "حسب المشروع",
  task: "مهمة",
  admin: "الإدارة",
  fields: "الحقول",
  space: "مساحة",
  website: "إدارة الموقع",
  "hero-slides": "الصور الرئيسية",
  new: "جديد",
  attendance: "الحضور والإجازات",
  payroll: "الرواتب",
  "loans-advances": "القروض والسلف",
  announcements: "الإعلانات",
  "rest-password": "إعادة تعيين كلمة المرور",
  treasury: "الخزانة",
  payments: "المدفوعات",
  company: "الشركة",
  accounting: "المحاسبة",
  bookkeeping: "مسك الدفاتر",
  vendors: "الموردين",
  contractors: "المقاولون",
  clients: "العملاء",
  expense: "المصروف",
  expenses: "المصروفات",
  "bulk-expenses": "مصروفات مجمعة",
  income: "الدخل",
  maps: "الخرائط",
  monthly: "الرواتب الشهرية",
  percentages: "النسب",
  role: "الدور",
  roles: "الأدوار",
  specializations: "التخصصات",
  invoices: "الفواتير",
  operations: "العمليات",
  contracts: "العقود",
  distribute: "توزيع نسبة",
  history: "سجل",
  requests: "طلبات العمل",
  bids: "العروض",
  counter: "العرض المضاد",
  milestones: "مرحلة",
  reports: "تقارير",
  team: "الفريق",
  teams: "فرق المشاريع",
  permissions: "الصلاحيات",
  batches: "دفعات",
  batch: "دفعة",
  distribution: "التوزيع",
  shops: "متاجر",
  divisions: "الأقسام",
  categories: "التصنيفات",
  subcategories: "التصنيفات الفرعية",
  products: "المنتجات",
  salaries: "الرواتب",
  orders: "الطلبات",
  boq: "جدول الكميات",
  types: "الأنواع",
  type: "النوع",
  boqtype: "نوع جدول الكميات",
  boqtypes: "أنواع جدول الكميات",
  boqreview: "مراجعة جدول الكميات",
  zones: "المناطق",
  "contractor-payments": "مدفوعات المقاولين",
  tracking: "مدفوعات المقاولين والطلبات والعقود",
  sessions: "جلسات المستخدمين",
  banks: "البنوك",
  logs: "السجلات",
  "pending-distribution": "مدفوعات قيد التوزيع",
  "password-reset": "إعادة تعيين كلمة مرور مستخدم",
  "change-password": "تغيير كلمة المرور",
  "execution-management": "إدارة التنفيذ",
  add: "إضافة",
  edit: "تعديل",
  view: "عرض",
  departments: "الأقسام",
  templates: "القوالب",
  "project-distributions": "توزيع المشاريع",
  "project-shares": "حصص المشاريع",
  shares: "حصص المشاريع",
  counters: "العدادات",
};

const findEntity = (path: string) =>
  BREADCRUMB_ENTITIES.findIndex((e) => e.patterns.some((pattern) => matchPath({ path: pattern, end: true }, path)));

// Turns the current pathname into header breadcrumbs, naming id segments
// after the record they point at (project name, task title, ...).
export function useBreadcrumbs(pathname: string): Crumb[] {
  const parts = pathname.split("/").filter(Boolean);
  const pathAt = (i: number) => "/" + parts.slice(0, i + 1).join("/");

  // every id segment, with the index of the BREADCRUMB_ENTITIES rule that
  // names it (-1 when none does)
  const ids = parts.flatMap((value, i) =>
    UUID_RE.test(value) ? [{ index: i, value, entity: findEntity(pathAt(i)) }] : [],
  );

  const results = useQueries({
    queries: ids.map((s) => ({
      queryKey: ["breadcrumb-label", s.entity, s.value],
      queryFn: () => BREADCRUMB_ENTITIES[s.entity].resolve(s.value),
      enabled: s.entity >= 0,
      staleTime: 5 * 60 * 1000,
      retry: false,
    })),
  });

  return parts.flatMap((value, i): Crumb[] => {
    const idPos = ids.findIndex((s) => s.index === i);
    if (idPos >= 0) {
      const { entity } = ids[idPos];
      const result = results[idPos];
      return [
        {
          path: pathAt(i),
          label: result.data || `#${value.slice(0, 8)}`,
          loading: entity >= 0 && result.isLoading,
        },
      ];
    }
    if (PREFIX_ONLY.has(value) && UUID_RE.test(parts[i + 1] ?? "")) return [];
    return [{ path: pathAt(i), label: SEGMENT_NAMES[value] ?? value.replace(/-/g, " "), loading: false }];
  });
}
