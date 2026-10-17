import type { LogEvent, LogSource } from "../../types/logs.types";
import { formatCurrency } from "../../utils/helpper";

// Arabic names for the fields that appear in detail.changes and in
// balance_change.field. A field without an entry shows its token.
const FIELD_LABELS: Record<string, string> = {
  amount: "المبلغ",
  grand_total: "الإجمالي",
  total_amount: "المبلغ الإجمالي",
  penalty_amount: "قيمة الخصم",
  discounting: "الخصم",
  currency: "العملة",
  contractor_id: "المقاول",
  vendor_id: "المورد",
  expense_id: "المصروف",
  expense_type: "نوع المصروف",
  phase: "المرحلة",
  expense_date: "تاريخ المصروف",
  is_percentage: "مصروف بنسبة",
  payment_method: "طريقة الدفع",
  account_id: "الحساب",
  income_date: "التاريخ",
  date: "التاريخ",
  fund: "مصدر المال",
  map_id: "الخريطة",
  status: "الحالة",
  project_id: "المشروع",
  terms: "الشروط",
  advance_percentage: "نسبة الدفعة المقدمة",
  insurance_percentage: "نسبة التأمين",
  delay_penalty_per_day: "غرامة التأخير اليومية",
  duration_days: "المدة بالأيام",
  start_date: "تاريخ البداية",
  end_date: "تاريخ النهاية",
  total_salary: "الراتب الإجمالي",
  basic_salary: "الراتب الأساسي",
  percentage_salary: "راتب النسبة",
  cash_amount: "نقداً",
  bank_amount: "مصرفياً",
  pay_date: "تاريخ الصرف",
  employee_id: "الموظف",
  percentage: "النسبة",
  total: "الإجمالي",
  cash_held: "نقد محجوز",
  bank_held: "مصرفي محجوز",
  discount: "الخصم",
  user_id: "المستفيد",
  item_type: "نوع البند",
  company_percentage: "نسبة الشركة",
  bank_percentage: "نسبة المصرف",
  type: "النوع",
  days_needed: "الأيام المطلوبة",
  // balance_change fields
  balance: "الرصيد",
  total_transactions: "إجمالي المعاملات",
  total_expense: "إجمالي المصروفات",
  total_percentage: "إجمالي النسب",
  refund: "المرتجعات",
  maps: "الخرائط",
  bank_balance: "الرصيد المصرفي",
  cash_balance: "الرصيد النقدي",
  loan_debt: "السلف",
  base_salary: "الراتب الأساسي",
};

export const fieldLabel = (field: string) => FIELD_LABELS[field] ?? field;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A before/after value for display. Ids are not meaningful to people. */
export function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "نعم" : "لا";
  if (typeof value === "number") return value.toLocaleString("en-US");
  const text = String(value);
  if (UUID_RE.test(text)) return "(تغيّر)";
  return text.length > 80 ? `${text.slice(0, 80)}…` : text;
}

export interface FieldChange {
  field: string;
  label: string;
  before: string;
  after: string;
}

/** detail.changes = {field: [before, after]} → a list for display. */
export function changesOf(event: LogEvent): FieldChange[] {
  const detail = event.detail ?? {};
  if (event.log_name === "balance_change" && typeof detail.field === "string") {
    return [
      {
        field: detail.field,
        label: fieldLabel(detail.field),
        before: displayValue(detail.before),
        after: displayValue(detail.after),
      },
    ];
  }
  const changes = detail.changes;
  if (!changes || typeof changes !== "object") return [];
  return Object.entries(changes as Record<string, unknown>).map(([field, pair]) => {
    const [before, after] = Array.isArray(pair) ? pair : [undefined, undefined];
    return {
      field,
      label: fieldLabel(field),
      before: displayValue(before),
      after: displayValue(after),
    };
  });
}

/** Shown next to the actor when the database couldn't name a person. */
export function sourceLabel(source: LogSource): string | null {
  switch (source) {
    case "service_role":
      return "عبر مفتاح الخدمة — المنفّذ غير معروف";
    case "auth":
      return "عبر نظام تسجيل الدخول";
    case "anon":
      return "زائر غير مسجّل";
    case "system":
      return "النظام";
    case "backfill":
      return "مستنتج من بيانات سابقة";
    default:
      return null;
  }
}

export type EventTone = "positive" | "negative" | "neutral";

const NEGATIVE = new Set([
  "declined", "rejected", "revoked", "deleted", "hard_deleted", "removed",
  "cancelled", "senior_rejected", "price_rejected", "reversed", "unapproved",
  "item_removed", "self_deleted", "quote_withdrawn",
]);
const POSITIVE = new Set([
  "approved", "granted", "paid", "completed", "price_approved", "senior_approved",
  "quoted_auto_approved", "arrived", "hired", "awarded", "activated",
  "finance_entered", "executed", "assigned", "added",
]);

export function toneOf(action: string): EventTone {
  if (NEGATIVE.has(action)) return "negative";
  if (POSITIVE.has(action)) return "positive";
  return "neutral";
}

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : null);

const CASH_KIND: Record<string, string> = {
  income: "إيراد",
  refund: "مرتجع",
  map: "خريطة",
};
const BALANCE_TABLE: Record<string, string> = {
  accounts: "حساب المشروع",
  project_balances: "رصيد المشروع",
  company_account: "حساب الشركة",
  employee_account: "حساب الموظف",
};

/** One short line saying what the row is about, for the activity table. */
export function subjectOf(event: LogEvent): string {
  const d = event.detail ?? {};
  const serial = str(d.serial_number) ?? (typeof d.serial_number === "number" ? String(d.serial_number) : null);
  switch (event.log_name) {
    case "contractor_payment":
      return `دفعة مقاول ${str(d.payments_number) ?? ""}`.trim();
    case "contractor_penalty":
      return "خصم على مقاول";
    case "payment_request":
      return `طلب دفع${serial ? ` #${serial}` : ""}`;
    case "expense":
      return `مصروف${serial ? ` #${serial}` : ""}${str(d.description) ? ` — ${d.description}` : ""}`;
    case "expense_payment":
      return `دفعة مصروف${serial ? ` #${serial}` : ""}`;
    case "project_cash":
      return `${CASH_KIND[String(d.kind)] ?? "قيد"}${serial ? ` #${serial}` : ""}`;
    case "balance_change": {
      const table = BALANCE_TABLE[String(d.balance_table)] ?? "رصيد";
      // Merged rows (groupEvents.ts) carry several fields in detail.changes.
      return typeof d.field === "string" ? `${table} — ${fieldLabel(d.field)}` : table;
    }
    case "payroll":
      return `راتب ${str(d.employee_name) ?? ""}`.trim();
    case "distribution_run":
      return str(d.person_name) ? `حصة ${d.person_name}` : "دورة توزيع";
    case "distribution_split":
      return `نسبة ${str(d.person_name) ?? ""}`.trim();
    case "bank_detail":
      return str(d.party_name) ?? "بيانات مصرفية";
    case "permission_grant":
      return [str(d.permission_name), str(d.subject_label)].filter(Boolean).join(" — ");
    case "role_assignment":
      return str(d.user_name) ?? "دور";
    case "team_assignment":
      return str(d.person_name) ?? "عضو فريق";
    case "account":
      return str(d.user_name) ?? "حساب";
    case "shop_order":
      return `طلب شراء${str(d.vendor_ref) ? ` ${d.vendor_ref}` : ""}`;
    case "contract":
      return "عقد";
    case "contract_round":
      return str(d.title) ?? "جولة تسعير";
    case "milestone":
      return str(d.title) ?? "مرحلة";
    case "project_status":
      return str(d.project_name) ?? event.project_name ?? "مشروع";
    case "employee_terms":
      return str(d.employee_name) ?? "موظف";
    case "hr_hiring":
      return str(d.applicant_name) ?? str(d.position_title) ?? "توظيف";
    default:
      return event.log_label ?? event.log_name;
  }
}

/** The event's amount, when it has one. balance_change carries the delta. */
export function amountOf(event: LogEvent): string | null {
  if (event.amount === null || event.amount === undefined) return null;
  const value = Number(event.amount);
  if (Number.isNaN(value)) return null;
  const text = formatCurrency(Math.abs(value), event.currency ?? "LYD");
  if (event.log_name === "balance_change") return `${value >= 0 ? "+" : "−"}${text}`;
  return text;
}

/** Full date and time, for tooltips and the activity table. */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ar-LY", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
