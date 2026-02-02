import { ExpenseStatus } from "../types/global.type";

export const translatePaymentMethod = (
  method: "cash" | "cheque" | "transfer" | "deposit" | "bank",
): string => {
  const translations = {
    cash: "نقدي",
    cheque: "شيك",
    transfer: "تحويل",
    deposit: "إيداع",
    bank: "بنك",
  };

  return translations[method] || method;
};

export const translateFundSource = (
  fund: "client" | "internal" | "sale" | "refund" | "other",
): string => {
  const translations = {
    client: "عميل",
    internal: "داخلي",
    sale: "بيع",
    refund: "استرداد",
    other: "أخرى",
  };

  return translations[fund] || fund;
};

// For expense type if needed
export const translateExpenseType = (
  type: "material" | "labor" | "maps",
): string => {
  const translations = {
    material: "مواد",
    labor: "عمالة",
    maps: "خرائط",
  };

  return translations[type] || type;
};

// For phase if needed
export const translatePhase = (
  phase: "construction" | "finishing" | "initial",
): string => {
  const translations = {
    construction: "بناء",
    finishing: "تشطيب",
    initial: "مبدئي",
  };

  return translations[phase] || phase;
};

export const translateExpenseStatus = (status: ExpenseStatus): string => {
  const translations = {
    pending: "قيد الانتظار",
    partially_paid: "مدفوع جزئياً",
    paid: "مدفوع",
    overdue: "متأخر",
    cancelled: "ملغي",
    unpaid: "غير مدفوع",
    deleted: "محذوف",
  };

  return translations[status] || status;
};
export const translateProjectStatus = (status: string): string => {
  const statusTranslations: Record<string, string> = {
    active: "نشط",
    completed: "مكتمل",
    pending: "قيد الانتظار",
    on_hold: "متوقف مؤقتاً",
    cancelled: "ملغي",
  };

  return statusTranslations[status] || status;
};

export const translateStatus = (status: string): string => {
  const statusTranslations: Record<string, string> = {
    active: "نشط",
    inactive: "غير نشط",
    pending: "قيد الانتظار",
    approved: "موافق عليه",
    rejected: "مرفوض",
    completed: "مكتمل",
    cancelled: "ملغي",
  };
  return statusTranslations[status] || status;
};
