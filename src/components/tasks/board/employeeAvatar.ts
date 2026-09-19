import type { EmployeeLite } from "../../../hooks/tasks/useTaskBoard";

// Shared by AssigneeCell (stacked avatars) and the cross-board directory
// views (AssigneeViewPage's section headers) — extracted so there's one
// avatar look instead of each screen writing its own initials()/colorFor().

export function initials(employee: EmployeeLite): string {
  const a = employee.first_name?.[0] ?? "";
  const b = employee.last_name?.[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

const AVATAR_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

export function colorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
