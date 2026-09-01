import { useMutation } from "@tanstack/react-query";
import { permissionsDb } from "../../lib/permissionsDb";
import type {
  EffectivePermissionRow,
  PermissionCatalogRow,
} from "../../types/permissions.types";
import type { GrantDiff } from "../../components/permissions/permissionModel";
import type { RoleHolder } from "./useJobRoles";

// =====================================================================
// Impact preview for the role screen.
// =====================================================================
// guide section 4.2 step 5 asks for: "This affects 34 people. 31 will
// gain submit_orders. 3 already have it from a more specific rule and
// are unaffected." The guide calls this out as the one screen where a
// careless click changes many people at once, and says the preview is
// worth the extra build cost.
//
// HOW "AFTER" IS COMPUTED, since you cannot ask the resolver about a
// change that has not been saved:
//
//   The pending change is at layer 5 (role baseline), the LEAST
//   specific layer. So a holder's answer can only move if no more
//   specific layer speaks for that permission. Working down the ladder
//   from phase2-resolver.sql:
//
//     layer 3 user override      -> if a row exists, they are unaffected
//     layer 4 department baseline-> if a row exists, they are unaffected
//     layer 5 role baseline      -> otherwise, this change decides
//
//   Layers 1 and 2 are project-scoped and cannot be evaluated without a
//   project, so they are excluded — see the caveat below.
//
//   "Before" comes from effective_permissions(), one call per holder, as
//   the brief specifies. It is authoritative for company-wide
//   permissions.
//
// THE CAVEAT, SURFACED IN THE UI RATHER THAN HIDDEN HERE:
//   For project-scoped permissions the true answer also depends on the
//   grant's scope and on which projects each holder is on the team of,
//   and can be overridden per project in Phase 6. The count below is
//   therefore exact for company-wide permissions and an upper bound for
//   project-scoped ones. RoleImpactDialog says so on screen.
// =====================================================================

export interface PermissionImpact {
  permissionId: string;
  permissionLabel: string;
  isProjectScoped: boolean;
  /** Change being made at the role layer. */
  effect: "grant" | "deny" | "clear";
  /** Holders whose effective answer this change actually decides. */
  willGain: number;
  willLose: number;
  /** Holders shielded by a user override or a department baseline. */
  unaffectedBySpecificRule: number;
  /** Holders already at the target state — no change for them. */
  alreadyMatching: number;
}

export interface ImpactPreview {
  holderCount: number;
  perPermission: PermissionImpact[];
  hasProjectScoped: boolean;
}

interface Args {
  catalog: PermissionCatalogRow[];
  holders: RoleHolder[];
  diff: GrantDiff;
}

export function useRoleImpactPreview() {
  return useMutation<ImpactPreview, Error, Args>({
    mutationFn: async ({ catalog, holders, diff }) => {
      const byId = new Map(catalog.map((p) => [p.id, p]));
      const changedIds = [
        ...diff.upserts.map((u) => u.permission_id),
        ...diff.deletes,
      ];

      if (holders.length === 0 || changedIds.length === 0) {
        return { holderCount: holders.length, perPermission: [], hasProjectScoped: false };
      }

      const holderIds = holders.map((h) => h.id);

      // --- "Before": the resolver's own answer, one call per holder ---
      const beforeByHolder = new Map<string, Map<string, boolean>>();
      await Promise.all(
        holderIds.map(async (holderId) => {
          const { data, error } = await permissionsDb.rpc(
            "effective_permissions",
            { p_user_id: holderId },
          );
          if (error) throw error;
          const map = new Map<string, boolean>();
          for (const row of (data ?? []) as EffectivePermissionRow[]) {
            map.set(row.permission_name, row.allowed);
          }
          beforeByHolder.set(holderId, map);
        }),
      );

      // --- Which holders are shielded by a more specific layer? -------
      const { data: userGrants, error: userError } = await permissionsDb
        .from("user_permission_grants")
        .select("user_id, permission_id")
        .in("user_id", holderIds)
        .in("permission_id", changedIds);
      if (userError) throw userError;

      const shielded = new Set<string>(
        (userGrants ?? []).map((g) => `${g.user_id}:${g.permission_id}`),
      );

      const { data: employees, error: employeeError } = await permissionsDb
        .from("employees")
        .select("id, department_id")
        .in("id", holderIds);
      if (employeeError) throw employeeError;

      const departmentByHolder = new Map(
        (employees ?? []).map((e) => [e.id, e.department_id]),
      );
      const departmentIds = Array.from(
        new Set(
          (employees ?? [])
            .map((e) => e.department_id)
            .filter((d): d is string => Boolean(d)),
        ),
      );

      if (departmentIds.length > 0) {
        const { data: departmentGrants, error: departmentError } =
          await permissionsDb
            .from("department_permission_grants")
            .select("department_id, permission_id")
            .in("department_id", departmentIds)
            .in("permission_id", changedIds);
        if (departmentError) throw departmentError;

        const departmentPairs = new Set(
          (departmentGrants ?? []).map(
            (g) => `${g.department_id}:${g.permission_id}`,
          ),
        );

        for (const holderId of holderIds) {
          const departmentId = departmentByHolder.get(holderId);
          if (!departmentId) continue;
          for (const permissionId of changedIds) {
            if (departmentPairs.has(`${departmentId}:${permissionId}`)) {
              shielded.add(`${holderId}:${permissionId}`);
            }
          }
        }
      }

      // --- Fold it together --------------------------------------------
      const perPermission: PermissionImpact[] = [];
      let hasProjectScoped = false;

      const evaluate = (
        permissionId: string,
        effect: PermissionImpact["effect"],
        targetAllowed: boolean | null,
      ) => {
        const permission = byId.get(permissionId);
        if (!permission) return;
        if (permission.is_project_scoped) hasProjectScoped = true;

        let willGain = 0;
        let willLose = 0;
        let unaffected = 0;
        let alreadyMatching = 0;

        for (const holderId of holderIds) {
          if (shielded.has(`${holderId}:${permissionId}`)) {
            unaffected += 1;
            continue;
          }

          const before =
            beforeByHolder.get(holderId)?.get(permission.name) ?? false;

          // "clear" drops the role row, so the layer falls silent and the
          // floor is deny-by-default — nothing below layer 5 exists.
          const after = targetAllowed === null ? false : targetAllowed;

          if (before === after) alreadyMatching += 1;
          else if (after) willGain += 1;
          else willLose += 1;
        }

        perPermission.push({
          permissionId,
          permissionLabel: permission.description || permission.name,
          isProjectScoped: permission.is_project_scoped,
          effect,
          willGain,
          willLose,
          unaffectedBySpecificRule: unaffected,
          alreadyMatching,
        });
      };

      for (const upsert of diff.upserts) {
        evaluate(
          upsert.permission_id,
          upsert.allowed ? "grant" : "deny",
          upsert.allowed,
        );
      }
      for (const permissionId of diff.deletes) {
        evaluate(permissionId, "clear", null);
      }

      return { holderCount: holders.length, perPermission, hasProjectScoped };
    },
  });
}
