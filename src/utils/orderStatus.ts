export const STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار",
  quoted: "تم التسعير",
  approved: "تمت الموافقة",
  arrived: "تم الاستلام",
  cancelled: "ملغي",
  rejected: "مرفوض",
};

export const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  quoted: "bg-blue-50 text-blue-700",
  approved: "bg-green-50 text-green-700",
  arrived: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-50 text-red-700",
  rejected: "bg-red-50 text-red-700",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function statusStyle(status: string): string {
  return STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600";
}
