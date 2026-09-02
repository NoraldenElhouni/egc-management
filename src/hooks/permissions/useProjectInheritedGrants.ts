import { useQuery } from "@tanstack/react-query";
import { permissionsDb } from "../../lib/permissionsDb";
import { supabase } from "../../lib/supabaseClient";

// =====================================================================
// "What would this person have on this project WITHOUT their own
// override?" — the where-it-came-from column for the team-member editor
// =====================================================================
//
// READ-ONLY, DISPLAY-ONLY. Same standing rule as every other permission
// hook so far: nothing here gates a route, hides a control, or changes
// what any screen renders. Phase 7 is when the resolver starts driving
// behaviour.
//
// WHY THIS DOES NOT JUST CALL effective_permissions()
//
// The resolver answers with layer 1 INCLUDED, and layer 1 is precisely
// the layer this screen edits. Asking it "what does Youssef have on
// project 42" returns his own override wherever he has one, which is the
// one thing the column must not show — the admin needs to see what sits
// UNDERNEATH, so they can tell whether an override is actually changing
// anything or just restating the layer below.
//
// So this composes layers 2 through 5 in the same precedence the
// resolver uses. That is a re-implementation, and re-implementing the
// ladder is exactly what the guide warns against — with one narrow
// exemption, which Phase 3 already took for useInheritedGrants and which
// applies for the same reason here: this output is a sentence on an
// admin screen, never an access decision. Phase 7 must not build on it.
//
// It also deliberately stops at the layers, and does NOT re-derive
// eligibility (active + party_type = company). An ineligible account is
// denied everything by the resolver regardless of what these layers say,
// and duplicating that gate here would be a second place to get it
// wrong. The screen only lists people who are on the team.
//
// SCOPE, on layer 3: the person is on this project's team by
// construction — the roster is where the screen gets them from — so both
// all_projects and team_projects_only grants apply. That is why there is
// no scope test below; adding one would be dead code that looks load
// bearing.
// =====================================================================

export type InheritedLayer =
  | "project_default"
  | "user_override"
  | "department_baseline"
  | "role_baseline";

export interface ProjectInheritedGrant {
  permission_id: string;
  allowed: boolean;
  layer: InheritedLayer;
  /** Human name of whatever the grant hangs off: a department, a role. */
  ownerName: string;
}

export const projectInheritedKey = (projectId: string, userId: string) => [
  "project-inherited-grants",
  projectId,
  userId,
];

export function useProjectInheritedGrants(
  projectId: string | undefined,
  userId: string | undefined,
) {
  return useQuery<Record<string, ProjectInheritedGrant>>({
    queryKey: projectInheritedKey(projectId ?? "none", userId ?? "none"),
    enabled: Boolean(projectId && userId),
    queryFn: async () => {
      const result: Record<string, ProjectInheritedGrant> = {};

      // Written weakest-first so each stronger layer simply overwrites
      // the entry: role (5) → department (4) → user (3) → project (2).
      // Same order the resolver's COALESCE resolves in, read backwards.

      // --- Layer 5: role baselines -----------------------------------
      const { data: roleRows, error: roleError } = await supabase
        .from("user_roles")
        .select("role_id, roles(name)")
        .eq("user_id", userId as string);
      if (roleError) throw roleError;

      const roleIds = (roleRows ?? []).map((r) => r.role_id);
      const roleNameById = new Map<string, string>(
        (roleRows ?? []).map((r) => [
          r.role_id,
          (Array.isArray(r.roles)
            ? r.roles[0]?.name
            : (r.roles as { name?: string })?.name) ?? "دور",
        ]),
      );

      if (roleIds.length > 0) {
        const { data, error } = await permissionsDb
          .from("role_permission_grants")
          .select("role_id, permission_id, allowed")
          .in("role_id", roleIds);
        if (error) throw error;

        for (const row of data ?? []) {
          const existing = result[row.permission_id];
          // Two roles disagreeing: deny wins, matching the resolver's
          // bool_and (phase2-resolver.sql, DECISION 5).
          if (existing && existing.allowed === false) continue;
          result[row.permission_id] = {
            permission_id: row.permission_id,
            allowed: existing ? existing.allowed && row.allowed : row.allowed,
            layer: "role_baseline",
            ownerName: roleNameById.get(row.role_id) ?? "دور",
          };
        }
      }

      // --- Layer 4: department baseline ------------------------------
      const { data: employeeRow, error: employeeError } = await permissionsDb
        .from("employees")
        .select("department_id")
        .eq("id", userId as string)
        .maybeSingle();
      if (employeeError) throw employeeError;

      const departmentId = employeeRow?.department_id ?? null;
      if (departmentId) {
        const { data: department } = await permissionsDb
          .from("departments")
          .select("name, name_ar")
          .eq("id", departmentId)
          .maybeSingle();
        const departmentName =
          department?.name_ar || department?.name || "القسم";

        const { data, error } = await permissionsDb
          .from("department_permission_grants")
          .select("permission_id, allowed")
          .eq("department_id", departmentId);
        if (error) throw error;

        for (const row of data ?? []) {
          result[row.permission_id] = {
            permission_id: row.permission_id,
            allowed: row.allowed,
            layer: "department_baseline",
            ownerName: departmentName,
          };
        }
      }

      // --- Layer 3: the person's own company-wide override -----------
      const { data: userGrants, error: userError } = await permissionsDb
        .from("user_permission_grants")
        .select("permission_id, allowed")
        .eq("user_id", userId as string);
      if (userError) throw userError;

      for (const row of userGrants ?? []) {
        result[row.permission_id] = {
          permission_id: row.permission_id,
          allowed: row.allowed,
          layer: "user_override",
          ownerName: "استثناء خاص بالشخص",
        };
      }

      // --- Layer 2: this project's default ---------------------------
      const { data: projectDefaults, error: defaultsError } =
        await permissionsDb
          .from("project_permission_defaults")
          .select("permission_id, allowed")
          .eq("project_id", projectId as string);
      if (defaultsError) throw defaultsError;

      for (const row of projectDefaults ?? []) {
        result[row.permission_id] = {
          permission_id: row.permission_id,
          allowed: row.allowed,
          layer: "project_default",
          ownerName: "إعداد المشروع",
        };
      }

      return result;
    },
  });
}

export const INHERITED_LAYER_LABELS: Record<InheritedLayer, string> = {
  project_default: "من إعدادات هذا المشروع",
  user_override: "من استثناء خاص بالشخص",
  department_baseline: "من القسم",
  role_baseline: "من الدور",
};
