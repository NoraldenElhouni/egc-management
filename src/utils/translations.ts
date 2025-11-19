export const translatePaymentMethod = (
  method: "cash" | "cheque" | "transfer" | "deposit"
): string => {
  const translations = {
    cash: "نقدي",
    cheque: "شيك",
    transfer: "تحويل",
    deposit: "إيداع",
  };

  return translations[method] || method;
};

export const translateFundSource = (
  fund: "client" | "internal" | "sale" | "refund" | "other"
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
export const translateExpenseType = (type: "material" | "labor"): string => {
  const translations = {
    material: "مواد",
    labor: "عمالة",
  };

  return translations[type] || type;
};

// For phase if needed
export const translatePhase = (phase: "construction" | "finishing"): string => {
  const translations = {
    construction: "بناء",
    finishing: "تشطيب",
  };

  return translations[phase] || phase;
};

export const translateExpenseStatus = (
  status: "pending" | "partially_paid" | "paid" | "overdue" | "cancelled"
): string => {
  const translations = {
    pending: "قيد الانتظار",
    partially_paid: "مدفوع جزئياً",
    paid: "مدفوع",
    overdue: "متأخر",
    cancelled: "ملغي",
  };

  return translations[status] || status;
};
