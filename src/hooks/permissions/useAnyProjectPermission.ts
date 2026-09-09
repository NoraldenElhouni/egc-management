import { useQueries } from "@tanstack/react-query";
import { permissionsDb } from "../../lib/permissionsDb";
import type { EffectivePermissionRow } from "../../types/permissions.types";
import { useAuthUserId, myPermissionsKey } from "./useCan";

// =====================================================================
// "Does this project-scoped permission apply to me on ANY project?"
// =====================================================================
// A project-scoped permission only ever answers for one project at a
// time — asked with none, it always denies (phase2-resolver.sql
// DECISION 3). There is no company-wide "do I have this anywhere" call.
// So this checks a small, caller-supplied set of CANDIDATE projects
// instead of every project in the company, and is true if any one of
// them resolves true.
//
// Every check still goes through my_effective_permissions() — this does
// NOT read grant tables directly. useProjectInheritedGrants.ts already
// does that, and its own header explains why that pattern is
// display-only and must never drive an access decision. This hook
// drives a real one (menu/sidebar visibility), so it stays on the
// resolver.
//
// Each query shares its cache entry with useMyPermissions/useCan for the
// same (user, project) pair — a project already checked elsewhere on the
// page costs nothing extra here.
// =====================================================================
export function useAnyProjectPermission(
  permissionName: string,
  candidateProjectIds: string[],
): { can: boolean; loading: boolean } {
  const { userId, resolved } = useAuthUserId();
  const ids = Array.from(new Set(candidateProjectIds.filter(Boolean)));

  const results = useQueries({
    queries: ids.map((projectId) => ({
      queryKey: myPermissionsKey(userId, projectId),
      enabled: !!userId && resolved,
      staleTime: 30_000,
      queryFn: async () => {
        const { data, error } = await permissionsDb.rpc(
          "my_effective_permissions",
          { p_project_id: projectId },
        );
        if (error) throw error;
        return new Set(
          ((data ?? []) as EffectivePermissionRow[])
            .filter((row) => row.allowed)
            .map((row) => row.permission_name),
        );
      },
    })),
  });

  if (ids.length === 0) {
    return { can: false, loading: !resolved };
  }

  const can = results.some((r) => (r.data as Set<string> | undefined)?.has(permissionName));
  // Once any candidate has already answered true, stop treating this as
  // loading — the other candidates settling later cannot change a "yes".
  const loading = !resolved || (!can && results.some((r) => r.isPending));

  return { can, loading };
}
