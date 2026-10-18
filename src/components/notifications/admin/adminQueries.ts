import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminDelete,
  adminList,
  adminSave,
  adminTables,
  type AdminKind,
} from "../../../services/notifications/notifyApi";

// React Query wrappers for the notification console. Every save refreshes
// every list (they reference each other: rules name event types, checks
// name ladders) and the history tab.

export const adminKey = (kind: AdminKind | "tables" | "history" | "simulations") => ["notify-admin", kind];

export function useAdminList<T>(kind: AdminKind) {
  return useQuery({ queryKey: adminKey(kind), queryFn: () => adminList<T>(kind) });
}

export function useAdminTables(enabled = true) {
  return useQuery({ queryKey: adminKey("tables"), queryFn: adminTables, enabled, staleTime: 60_000 });
}

export function useAdminSave(kind: AdminKind) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ row, confirm }: { row: Record<string, unknown>; confirm?: boolean }) => adminSave<unknown>(kind, row, confirm),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notify-admin"] }),
  });
}

export function useAdminDelete(kind: AdminKind) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminDelete(kind, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notify-admin"] }),
  });
}

/** A save that came back asking for confirmation (a rule reaching many people). */
export function needsConfirm(result: unknown): result is { needs_confirm: true; recipient_count: number } {
  return !!result && typeof result === "object" && (result as { needs_confirm?: boolean }).needs_confirm === true;
}

export const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500";
export const labelClass = "text-xs font-medium text-gray-500";
