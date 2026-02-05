import { ExpenseStatus, Projects } from "../../types/global.type";

export const projectStatusColor = (s: Projects["status"]) => {
  switch (s) {
    case "active":
      return "bg-emerald-100 text-emerald-800";
    case "paused":
      return "bg-amber-100 text-amber-800";
    case "completed":
      return "bg-sky-100 text-sky-800";
    case "cancelled":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
};
export const statusColor = (s: string) => {
  switch (s) {
    case "active":
      return "bg-emerald-100 text-emerald-800";
    case "paused":
      return "bg-amber-100 text-amber-800";
    case "completed":
      return "bg-sky-100 text-sky-800";
    case "cancelled":
      return "bg-rose-100 text-rose-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "approved":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
};

export const getExpenseStatusColor = (status: ExpenseStatus): string => {
  const colors = {
    pending: "bg-yellow-100 text-yellow-800",
    partially_paid: "bg-blue-100 text-blue-800",
    paid: "bg-green-100 text-green-800",
    overdue: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
    unpaid: "bg-red-100 text-red-800",
    deleted: "bg-red-300 text-red-900",
  };

  return colors[status] || "bg-gray-100 text-gray-800";
};
