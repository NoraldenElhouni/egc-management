import type { LogGroup } from "../types/logs.types";

/**
 * The four permissions that open the logs (migration 09). Any one of them
 * lets a user into the activity log page; get_history()/get_activity()
 * then return only the groups that user may read.
 */
export const LOG_PERMISSIONS = [
  "view_finance_logs",
  "view_access_logs",
  "view_operations_logs",
  "view_hr_logs",
] as const;

export const LOG_GROUPS: { id: LogGroup; label: string; permission: string }[] = [
  { id: "finance", label: "المالية", permission: "view_finance_logs" },
  { id: "access", label: "الصلاحيات والحسابات", permission: "view_access_logs" },
  { id: "operations", label: "العمليات", permission: "view_operations_logs" },
  { id: "hr", label: "الموارد البشرية", permission: "view_hr_logs" },
];

/**
 * The 22 logs, for the activity page's filter. Names and labels mirror
 * logs.catalog (migration 01); rows returned by the API carry the
 * database's own label in `log_label`.
 */
export const LOG_NAMES: { name: string; group: LogGroup; label: string }[] = [
  { name: "contractor_payment", group: "finance", label: "دفعات المقاولين" },
  { name: "contractor_penalty", group: "finance", label: "خصومات المقاولين" },
  { name: "payment_request", group: "finance", label: "طلبات الدفع (العقود)" },
  { name: "expense_payment", group: "finance", label: "دفعات المصروفات" },
  { name: "expense", group: "finance", label: "المصروفات" },
  { name: "project_cash", group: "finance", label: "الإيرادات والمرتجعات والخرائط" },
  { name: "balance_change", group: "finance", label: "تغييرات الأرصدة" },
  { name: "payroll", group: "finance", label: "الرواتب" },
  { name: "distribution_run", group: "finance", label: "التوزيعات" },
  { name: "distribution_split", group: "finance", label: "نسب التوزيع" },
  { name: "bank_detail", group: "finance", label: "البيانات المصرفية" },
  { name: "permission_grant", group: "access", label: "الصلاحيات" },
  { name: "role_assignment", group: "access", label: "الأدوار" },
  { name: "team_assignment", group: "access", label: "فرق المشاريع" },
  { name: "account", group: "access", label: "الحسابات" },
  { name: "shop_order", group: "operations", label: "طلبات الشراء" },
  { name: "contract", group: "operations", label: "العقود" },
  { name: "contract_round", group: "operations", label: "جولات التسعير" },
  { name: "milestone", group: "operations", label: "مراحل العقود" },
  { name: "project_status", group: "operations", label: "حالة المشاريع" },
  { name: "employee_terms", group: "hr", label: "بيانات التوظيف" },
  { name: "hr_hiring", group: "hr", label: "التوظيف" },
];
