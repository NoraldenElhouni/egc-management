import { useQuery } from "@tanstack/react-query";
import { permissionsDb } from "../../lib/permissionsDb";
import type { EffectivePermissionRow } from "../../types/permissions.types";

// =====================================================================
// PHASE 7B — the desktop app's one gating hook
// =====================================================================
// Everything else in src/hooks/permissions/ is admin-screen plumbing:
// read-only, display-only, and it takes a user id because it exists to
// show you someone ELSE's permissions. This file is the opposite. It
// answers "what may *I* do", it drives real UI, and it deliberately has
// no user-id parameter — my_effective_permissions() reads auth.uid()
// itself, so no caller can ask on another person's behalf.
//
// ONE CALL, NOT N. Batches 4 and 5 gate dozens of menu items on the
// same page. useCan() does not fetch; it reads the single cached answer
// that useMyPermissions() holds, so twenty gated items on one screen
// still cost one round trip. React Query dedupes concurrent callers of
// the same key, so this holds even on first paint.
//
// DENY WHILE LOADING, DENY ON ERROR. A permission that has not been
// resolved yet is not a grant, and neither is a failed request. Callers
// that would flash a "you cannot do this" message should read `loading`
// and render a neutral state instead of the denial — see EmployeeRole.
//
// PROJECT SCOPE. Pass a projectId for project-scoped permissions.
// Without one the resolver returns allowed = false with source_layer
// 'no_project_context' for every project-scoped permission
// (phase2-resolver.sql, DECISION 3). That is correct, but it means a
// project permission asked company-wide always denies. Check
// permission_catalog.is_project_scoped if you are unsure which you have.
// =====================================================================

export const myPermissionsKey = (projectId?: string) => [
  "my-effective-permissions",
  projectId ?? "company",
];

/**
 * Every permission the current user has, as a set of allowed names.
 *
 * Cached per project id. `staleTime` is deliberately short rather than
 * zero: a grant changed on an admin screen should show up on the next
 * navigation, not require a reload, but a page with twenty gated items
 * must not refetch twenty times while it mounts.
 */
export function useMyPermissions(projectId?: string) {
  return useQuery<Set<string>>({
    queryKey: myPermissionsKey(projectId),
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await permissionsDb.rpc(
        "my_effective_permissions",
        projectId ? { p_project_id: projectId } : {},
      );
      if (error) throw error;
      return new Set(
        ((data ?? []) as EffectivePermissionRow[])
          .filter((row) => row.allowed)
          .map((row) => row.permission_name),
      );
    },
  });
}

export interface CanResult {
  /** False until the resolver has answered. Never optimistic. */
  can: boolean;
  /** True while the answer is in flight. Render neutral, not denied. */
  loading: boolean;
  /** The resolver could not be reached. `can` is false in this case. */
  error: boolean;
}

/**
 * May the current user do this one thing?
 *
 * A name that is not in permission_catalog simply never appears in the
 * allowed set, so it denies. That is intentional — a typo in a
 * permission name must close a door, not open one.
 */
export function useCan(permissionName: string, projectId?: string): CanResult {
  const { data, isPending, isError } = useMyPermissions(projectId);

  return {
    can: data?.has(permissionName) ?? false,
    loading: isPending,
    error: isError,
  };
}
