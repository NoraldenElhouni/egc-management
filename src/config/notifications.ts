import type { NotificationPriority } from "../services/notifications/notifyApi";

// Arabic labels for the notification system's fixed vocabularies, shared by
// the inbox, the settings page, the admin console and the delivery log.

export const CATEGORY_LABELS: Record<string, string> = {
  orders: "طلبات الشراء",
  finance: "المالية",
  contracts: "العقود والدفعات",
  tasks: "المهام",
  hr: "الموارد البشرية",
  admin: "الإدارة",
  client: "العملاء",
  system: "النظام",
};

export const CLASS_LABELS: Record<string, string> = {
  alert: "تنبيه فوري",
  reminder: "تذكير بموعد",
  check: "فحص دوري",
  digest: "ضمن الملخص",
};

export const PRIORITY_LABELS: Record<NotificationPriority, string> = {
  critical: "حرج",
  high: "مرتفع",
  normal: "عادي",
  low: "منخفض",
};

export const PRIORITY_DOT: Record<NotificationPriority, string> = {
  critical: "bg-red-600",
  high: "bg-amber-500",
  normal: "bg-blue-500",
  low: "bg-gray-400",
};

export const AUDIENCE_LABELS: Record<string, string> = {
  company: "موظفو الشركة",
  contractor: "المقاولون",
  vendor: "الموردون",
  client: "العملاء",
};

export const MODE_LABELS: Record<string, string> = {
  immediate: "فوراً",
  digest: "في ملخص الصباح",
  off: "داخل التطبيق فقط",
};

export const RULE_MODE_LABELS: Record<string, string> = {
  live: "يعمل",
  shadow: "تجربة (يسجّل فقط)",
  off: "موقوف",
};

export const DB_EVENT_LABELS: Record<string, string> = {
  insert: "عند الإضافة",
  update: "عند التعديل",
  delete: "عند الحذف",
};

export const DELIVERY_STATUS_LABELS: Record<string, string> = {
  queued: "في الانتظار",
  sending: "قيد الإرسال",
  sent: "أُرسل",
  failed: "فشل",
  skipped: "لم يُرسل",
  suppressed: "أُوقف",
};

export const DELIVERY_REASON_LABELS: Record<string, string> = {
  preference_off: "أوقف المستخدم هذا النوع",
  snoozed: "المستخدم في إجازة أو أوقف الإشعارات مؤقتاً",
  no_device: "لا يوجد هاتف مسجّل",
  device_inactive: "الهاتف لم يعد نشطاً",
  deferred: "مؤجَّل (ساعات الهدوء أو الجمعة)",
  digest: "ضمن ملخص الصباح",
  rate_hour: "تجاوز حد الساعة — دُمج لاحقاً",
  rate_day: "تجاوز الحد اليومي",
  collapsed: "دُمج مع إشعارات أخرى",
  DeviceNotRegistered: "التطبيق حُذف من الهاتف",
};

export const CHANNEL_LABELS: Record<string, string> = {
  inapp: "داخل التطبيق",
  push: "تنبيه الهاتف",
  email: "البريد",
  whatsapp: "واتساب",
};

export const OPERATOR_LABELS: Record<string, string> = {
  eq: "يساوي",
  ne: "لا يساوي",
  gt: "أكبر من",
  gte: "أكبر من أو يساوي",
  lt: "أصغر من",
  lte: "أصغر من أو يساوي",
  in: "أحد القيم",
  not_in: "ليس أحد القيم",
  is_null: "فارغ",
  is_not_null: "غير فارغ",
  contains: "يحتوي",
  starts_with: "يبدأ بـ",
  changed: "تغيّر",
  changed_to: "تغيّر إلى",
  changed_from: "تغيّر من",
  older_than: "أقدم من",
  newer_than: "أحدث من",
  gt_column: "أكبر من العمود",
};

/** Operators that take no value. */
export const VALUELESS_OPERATORS = new Set(["is_null", "is_not_null", "changed"]);
/** Operators whose value is a list. */
export const LIST_OPERATORS = new Set(["in", "not_in"]);

export const RECIPIENT_TYPE_LABELS: Record<string, string> = {
  column: "شخص في السجل (عمود)",
  permission: "من يملك صلاحية",
  project_role: "دور في المشروع",
  party: "المورد / المقاول / العميل",
  task_assignees: "المكلفون بالمهمة",
  task_creator: "منشئ المهمة",
  space_manager: "مدير المساحة",
  manager_of: "المدير المباشر",
  watchers: "المتابعون",
  user: "مستخدم محدد",
};

/** Common time spans for intervals, in Postgres interval syntax. */
export const INTERVAL_OPTIONS = [
  { value: "0", label: "فوراً" },
  { value: "1 hour", label: "ساعة" },
  { value: "6 hours", label: "6 ساعات" },
  { value: "12 hours", label: "12 ساعة" },
  { value: "24 hours", label: "يوم" },
  { value: "48 hours", label: "يومان" },
  { value: "72 hours", label: "3 أيام" },
  { value: "4 days", label: "4 أيام" },
  { value: "7 days", label: "أسبوع" },
  { value: "14 days", label: "أسبوعان" },
  { value: "30 days", label: "30 يوماً" },
];

const arCount = (n: number, one: string, two: string, few: string, many: string) =>
  n === 1 ? one : n === 2 ? two : n % 100 >= 3 && n % 100 <= 10 ? `${n} ${few}` : `${n} ${many}`;

/** A Postgres interval as the database returns it ("24:00:00", "3 days", "1 day 02:00:00") in Arabic. */
export const intervalLabel = (v: string | null | undefined) => {
  if (!v) return "—";
  const hit = INTERVAL_OPTIONS.find((o) => o.value === v);
  if (hit) return hit.label;
  let days = Number(v.match(/(\d+)\s*days?/)?.[1] ?? 0);
  let hours = Number(v.match(/(\d+)\s*hours?/)?.[1] ?? 0);
  const clock = v.match(/(\d+):(\d{2}):\d{2}/);
  const minutes = clock ? Number(clock[2]) : 0;
  if (clock) hours += Number(clock[1]);
  if (hours >= 24 && hours % 24 === 0) {
    days += hours / 24;
    hours = 0;
  }
  const parts = [
    days ? arCount(days, "يوم", "يومان", "أيام", "يوماً") : "",
    hours ? arCount(hours, "ساعة", "ساعتان", "ساعات", "ساعة") : "",
    minutes ? `${minutes} دقيقة` : "",
  ].filter(Boolean);
  return parts.length ? parts.join(" و") : "فوراً";
};
