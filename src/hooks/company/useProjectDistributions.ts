import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { permissionsDb } from "../../lib/permissionsDb";
import { supabase } from "../../lib/supabaseClient";

// =====================================================================
// PROJECT DISTRIBUTION — reads and writes project_distributions
// =====================================================================
//
// Implementation guide sections 2.3 and 4.5. NEW file for Phase 5.
//
// NOTHING IN THE EXISTING DISTRIBUTION SUBSYSTEM IS TOUCHED. The old
// editor (EmployeeDistributionEditForm, reached through the distribute
// wizard) keeps working exactly as it does today, on the old table, at
// its existing route. Both paths exist side by side; that is the
// intended end state of this phase, not a temporary state.
//
// WHAT THIS FILE IS ABOUT
//   project + person + percentage. That is all. No project role, no
//   team membership, no access consequences of any kind. A partner can
//   hold a share on a project they have never visited; a salaried site
//   engineer can be on the team with no share. Neither is an error and
//   neither is inferred from the other (guide section 2.3).
//
// THE 100% RULE (guide section 4.5, confirmed)
//   projects.default_bank_percentage
// + projects.default_company_percentage
// + SUM(project_distributions.percentage)
// = 100
//   The bank and company shares are columns on the project, not rows
//   here — they are the house's cut, not a person's. So the people rows
//   do NOT total 100; they total whatever is left. A screen that shows
//   only the people rows and reports "65%" looks broken when it is in
//   fact correct, which is why the editor shows all three parts.
//
//   Soft warning only, never a hard block (confirmed decision). Ten of
//   the sixty-three live projects sum to 95 rather than 100, in an
//   identical 42.5 + 42.5 + 10 pattern that looks deliberate. A hard
//   block would make those projects uneditable.
// =====================================================================

export const projectDistributionsKey = (projectId: string) => [
  "project-distributions",
  projectId,
];
export const DISTRIBUTION_PROJECTS_KEY = ["distribution-projects"];

export interface DistributionShare {
  /** project_distributions.id */
  id: string;
  personId: string;
  fullName: string;
  email: string | null;
  percentage: number;
  /**
   * How many project_assignments rows this person has on this project.
   * Drives the legacy-representation warning in the UI — see the
   * dual-write notes further down.
   */
  legacyRowCount: number;
}

export interface ProjectShareSummary {
  projectId: string;
  projectName: string;
  bankPercentage: number;
  companyPercentage: number;
  peopleTotal: number;
  grandTotal: number;
  /** Within a rounding tolerance of 100. */
  balances: boolean;
}

const TOLERANCE = 0.01;

/**
 * Everyone with a share on one project, plus the project's own bank and
 * company percentages so the editor can show the full equation.
 */
export function useProjectDistribution(projectId: string | undefined) {
  return useQuery({
    queryKey: projectDistributionsKey(projectId ?? "none"),
    enabled: Boolean(projectId),
    queryFn: async () => {
      const [{ data: project, error: projectError }, { data: rows, error }] =
        await Promise.all([
          supabase
            .from("projects")
            .select(
              "id, name, default_bank_percentage, default_company_percentage",
            )
            .eq("id", projectId as string)
            .single(),
          permissionsDb
            .from("project_distributions")
            .select("id, person_id, percentage")
            .eq("project_id", projectId as string),
        ]);

      if (projectError) throw projectError;
      if (error) throw error;

      const distributionRows = rows ?? [];
      const personIds = distributionRows.map((r) => r.person_id);

      // Names, and the legacy row count used for the dual-write warning.
      const [{ data: users }, { data: legacyRows }] = await Promise.all([
        personIds.length
          ? supabase
              .from("users")
              .select("id, first_name, last_name, email")
              .in("id", personIds)
          : Promise.resolve({ data: [] as never[] }),
        supabase
          .from("project_assignments")
          .select("user_id")
          .eq("project_id", projectId as string),
      ]);

      const userById = new Map((users ?? []).map((u) => [u.id, u]));
      const legacyCount = new Map<string, number>();
      for (const row of legacyRows ?? []) {
        legacyCount.set(row.user_id, (legacyCount.get(row.user_id) ?? 0) + 1);
      }

      const shares: DistributionShare[] = distributionRows
        .map((row) => {
          const user = userById.get(row.person_id);
          return {
            id: row.id,
            personId: row.person_id,
            fullName:
              `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || "—",
            email: user?.email ?? null,
            percentage: Number(row.percentage),
            legacyRowCount: legacyCount.get(row.person_id) ?? 0,
          };
        })
        .sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));

      const bankPercentage = Number(project.default_bank_percentage ?? 0);
      const companyPercentage = Number(project.default_company_percentage ?? 0);
      const peopleTotal = shares.reduce((sum, s) => sum + s.percentage, 0);
      const grandTotal = bankPercentage + companyPercentage + peopleTotal;

      const summary: ProjectShareSummary = {
        projectId: project.id,
        projectName: project.name ?? "—",
        bankPercentage,
        companyPercentage,
        peopleTotal,
        grandTotal,
        balances: Math.abs(grandTotal - 100) <= TOLERANCE,
      };

      return { summary, shares };
    },
  });
}

export interface DistributionProjectListItem extends ProjectShareSummary {
  shareCount: number;
}

/** Every project with its three-part total, for the list page. */
export function useDistributionProjects() {
  return useQuery<DistributionProjectListItem[]>({
    queryKey: DISTRIBUTION_PROJECTS_KEY,
    queryFn: async () => {
      const { data: projects, error } = await supabase
        .from("projects")
        .select(
          "id, name, default_bank_percentage, default_company_percentage, serial_number",
        )
        .order("serial_number", { ascending: false });
      if (error) throw error;

      const { data: rows, error: rowsError } = await permissionsDb
        .from("project_distributions")
        .select("project_id, percentage");
      if (rowsError) throw rowsError;

      const totals = new Map<string, { sum: number; count: number }>();
      for (const row of rows ?? []) {
        const current = totals.get(row.project_id) ?? { sum: 0, count: 0 };
        current.sum += Number(row.percentage);
        current.count += 1;
        totals.set(row.project_id, current);
      }

      return (projects ?? []).map((project) => {
        const bankPercentage = Number(project.default_bank_percentage ?? 0);
        const companyPercentage = Number(
          project.default_company_percentage ?? 0,
        );
        const entry = totals.get(project.id) ?? { sum: 0, count: 0 };
        const grandTotal = bankPercentage + companyPercentage + entry.sum;
        return {
          projectId: project.id,
          projectName: project.name ?? "—",
          bankPercentage,
          companyPercentage,
          peopleTotal: entry.sum,
          grandTotal,
          balances: Math.abs(grandTotal - 100) <= TOLERANCE,
          shareCount: entry.count,
        };
      });
    },
  });
}

export interface DistributionCandidate {
  id: string;
  fullName: string;
  email: string | null;
}

/**
 * Who can be given a share.
 *
 * ALL company accounts — deliberately NOT filtered to the project team.
 * Restricting this to team members would make the partner case
 * unexpressible, and that case is the whole reason distribution is a
 * separate table (guide section 4.5 step 4).
 */
export function useDistributionCandidates() {
  return useQuery<DistributionCandidate[]>({
    queryKey: ["distribution-candidates"],
    queryFn: async () => {
      const { data: employees, error } = await permissionsDb
        .from("employees")
        .select("id");
      if (error) throw error;
      if (!employees?.length) return [];

      const { data: users, error: usersError } = await permissionsDb
        .from("users")
        .select("id, first_name, last_name, email, party_type")
        .in(
          "id",
          employees.map((e) => e.id),
        )
        .eq("party_type", "company");
      if (usersError) throw usersError;

      return (users ?? [])
        .map((u) => ({
          id: u.id,
          fullName: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || "—",
          email: u.email,
        }))
        .sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));
    },
  });
}

// ---------------------------------------------------------------------
// DUAL-WRITE — new table plus the old one
// ---------------------------------------------------------------------
//
// Same principle as Phase 4's team dual-write: the old screens must keep
// showing correct, live numbers, so every write here also lands in
// project_assignments.percentage.
//
// THE MAPPING IS NOT ONE-TO-ONE, AND THAT MATTERS
//
//   new: project_distributions   UNIQUE (project_id, person_id)
//        -> exactly one row per person per project
//   old: project_assignments     no unique constraint
//        -> one row per (person, PROJECT ROLE), so a person holding two
//           project roles has TWO rows, and the old screens SUM over all
//           of them
//
//   So "set Fatima to 25%" has three possible shapes in the old table:
//
//   1 existing row   -> set it to 25. Clean.
//   2+ existing rows -> set the canonical one (lowest id, deterministic)
//                       to 25 and the REST TO ZERO. The old screens sum,
//                       so this keeps their total right without deleting
//                       anyone's team row. Writing 25 to both would show
//                       50, which is the existing bug in
//                       EmployeeDistributionEditForm — see below.
//   0 existing rows  -> the partner case. Insert one, with
//                       project_role_id = NULL. Read the warning.
//
// ⚠️  OPEN QUESTION FOR THE PARTNER CASE — FLAGGED, NOT SOLVED
//
//   useProjectsDistribute.ts (the payout-run engine, untouched) filters
//   its query with:
//       .neq("project_assignments.project_role_id",
//            "c7823151-2290-4861-a383-5e00a78128ce")
//
//   In SQL, `col <> 'x'` evaluates to NULL when col is NULL, and a NULL
//   predicate drops the row. So rows written with project_role_id = NULL
//   are very likely INVISIBLE to the distribute wizard — meaning a
//   partner given a share through the new screen would not be paid by
//   the old engine.
//
//   The alternatives are all worse: picking an arbitrary project role
//   would show a partner as holding a job on the project (the exact
//   conflation this redesign removes), and refusing to add them at all
//   contradicts the requirement that they be addable.
//
//   NULL is the honest representation and it keeps the money visible in
//   the table. But DO NOT rely on the old wizard paying these people
//   until you have confirmed that filter's behaviour. The UI shows a
//   warning on any share with no legacy row, and the Phase 5 report has
//   the one-line change to that filter if you decide to make it.
//
// NOT A TRANSACTION, for the same reason as Phase 4: PostgREST has no
// client-side transaction. Order is new-table-first (it carries the
// uniqueness constraint, so a conflict fails before anything is
// written), with a compensating rollback if the legacy write fails.

interface UpsertArgs {
  projectId: string;
  personId: string;
  percentage: number;
  /** users.id of whoever is making the change. */
  updatedBy: string | null;
}

/**
 * Sets (or creates) one person's share.
 *
 * Relies on UNIQUE (project_id, person_id) rather than doing its own
 * "does a row exist" check — which is what makes the old table's
 * multi-row-update bug structurally impossible here. There is exactly
 * one row to write, and the database guarantees it.
 */
export function useSetProjectShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      personId,
      percentage,
      updatedBy,
    }: UpsertArgs) => {
      // Snapshot the old value so the compensating rollback can restore
      // it rather than guessing.
      const { data: before } = await permissionsDb
        .from("project_distributions")
        .select("id, percentage")
        .eq("project_id", projectId)
        .eq("person_id", personId)
        .maybeSingle();
      // .maybeSingle() is CORRECT here, unlike in the old code: the
      // UNIQUE constraint guarantees zero-or-one row. This is the
      // difference between relying on a constraint and hoping.

      const { error } = await permissionsDb
        .from("project_distributions")
        .upsert(
          {
            project_id: projectId,
            person_id: personId,
            percentage,
            updated_by: updatedBy,
            updated_at: new Date().toISOString(),
          } as never,
          { onConflict: "project_id,person_id" },
        );
      if (error) throw error;

      try {
        await writeLegacyPercentage(projectId, personId, percentage);
      } catch (legacyError) {
        // Undo the new-table write so the two cannot disagree.
        if (before) {
          await permissionsDb
            .from("project_distributions")
            .update({ percentage: before.percentage })
            .eq("id", before.id);
        } else {
          await permissionsDb
            .from("project_distributions")
            .delete()
            .eq("project_id", projectId)
            .eq("person_id", personId);
        }
        throw legacyError;
      }
    },
    onSuccess: (_d, variables) => {
      queryClient.invalidateQueries({
        queryKey: projectDistributionsKey(variables.projectId),
      });
      queryClient.invalidateQueries({ queryKey: DISTRIBUTION_PROJECTS_KEY });
    },
  });
}

interface RemoveArgs {
  projectId: string;
  personId: string;
}

/**
 * Removes one person's share.
 *
 * Sets the legacy rows to 0 rather than deleting them. Deleting would
 * remove that person's project_assignments row, which in the old schema
 * is ALSO their team membership — and removing someone's share must not
 * remove them from the team. That is the entire point of the split
 * (guide section 2.3).
 */
export function useRemoveProjectShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, personId }: RemoveArgs) => {
      const { data: before } = await permissionsDb
        .from("project_distributions")
        .select("id, percentage")
        .eq("project_id", projectId)
        .eq("person_id", personId)
        .maybeSingle();

      const { error } = await permissionsDb
        .from("project_distributions")
        .delete()
        .eq("project_id", projectId)
        .eq("person_id", personId);
      if (error) throw error;

      try {
        await writeLegacyPercentage(projectId, personId, 0);
      } catch (legacyError) {
        if (before) {
          await permissionsDb.from("project_distributions").insert({
            project_id: projectId,
            person_id: personId,
            percentage: before.percentage,
          });
        }
        throw legacyError;
      }
    },
    onSuccess: (_d, variables) => {
      queryClient.invalidateQueries({
        queryKey: projectDistributionsKey(variables.projectId),
      });
      queryClient.invalidateQueries({ queryKey: DISTRIBUTION_PROJECTS_KEY });
    },
  });
}

/** Bank and company shares live on the project row, not here. */
export function useSetProjectHouseShares() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      bankPercentage,
      companyPercentage,
    }: {
      projectId: string;
      bankPercentage: number;
      companyPercentage: number;
    }) => {
      const { error } = await supabase
        .from("projects")
        .update({
          default_bank_percentage: bankPercentage,
          default_company_percentage: companyPercentage,
        })
        .eq("id", projectId);
      if (error) throw error;
      // No dual-write needed: these are the same two columns the old
      // editor writes. One source, both screens.
    },
    onSuccess: (_d, variables) => {
      queryClient.invalidateQueries({
        queryKey: projectDistributionsKey(variables.projectId),
      });
      queryClient.invalidateQueries({ queryKey: DISTRIBUTION_PROJECTS_KEY });
    },
  });
}

// ---------------------------------------------------------------------
// The legacy half of the dual-write
// ---------------------------------------------------------------------

async function writeLegacyPercentage(
  projectId: string,
  personId: string,
  percentage: number,
): Promise<void> {
  const { data: legacyRows, error } = await supabase
    .from("project_assignments")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", personId)
    .order("id", { ascending: true });
  if (error) throw error;

  const rows = legacyRows ?? [];

  if (rows.length === 0) {
    // The partner case. See the warning in the dual-write notes above.
    const { error: insertError } = await supabase
      .from("project_assignments")
      .insert({
        project_id: projectId,
        user_id: personId,
        percentage,
        project_role_id: null,
      });
    if (insertError) throw insertError;
    return;
  }

  // Canonical row carries the whole percentage; any others go to zero so
  // the old screens' SUM stays correct. Matched BY ID, never by
  // (project, person) — matching by the pair is precisely the bug in
  // EmployeeDistributionEditForm, where one edit silently rewrites every
  // project-role row a person holds.
  const [canonical, ...others] = rows;

  const { error: updateError } = await supabase
    .from("project_assignments")
    .update({ percentage })
    .eq("id", canonical.id);
  if (updateError) throw updateError;

  for (const row of others) {
    const { error: zeroError } = await supabase
      .from("project_assignments")
      .update({ percentage: 0 })
      .eq("id", row.id);
    if (zeroError) throw zeroError;
  }
}
