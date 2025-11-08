import { Project } from "../../types/global.type";

export const statusColor = (s: Project["status"]) => {
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
