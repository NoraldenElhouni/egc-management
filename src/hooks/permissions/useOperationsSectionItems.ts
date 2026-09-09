import { useMemo } from "react";
import { OPERATIONS_ITEMS } from "../../config/navigation/operations";
import type { NavItem } from "../../config/navigation/types";
import { useProjects } from "../useProjects";
import { useAuthUserId } from "./useCan";
import { useAnyProjectPermission } from "./useAnyProjectPermission";
import { useMyTeamProjectIds } from "./useMyTeamProjectIds";

// =====================================================================
// OPERATIONS_ITEMS, resolved for the current user
// =====================================================================
// view_operations_maps/_contracts/_boq carry no `permission` field in
// OPERATIONS_ITEMS (see that file's own comment) because they're
// project-scoped and their destination is a project PICKER, not a
// project — there is nothing to check company-wide. Left alone, that
// means the three cards show for anyone who can reach Operations at
// all, even someone holding none of the three anywhere.
//
// This resolves the real question instead: can they enter at least one
// project through each? Checked against a small candidate set (their
// own team projects, plus a handful of general ones to catch an
// all_projects-scoped grant) rather than every project in the company —
// see useAnyProjectPermission for why a full sweep isn't needed.
//
// Shared by OperationsPage.tsx (menu grid) and OperationsLayout.tsx
// (sidebar) so the two surfaces resolve to the same answer — same
// principle as issue #15 (one list, not two that can drift).
// =====================================================================

const CANDIDATE_LIMIT = 5;

export function useOperationsSectionItems(): {
  items: NavItem[];
  loading: boolean;
} {
  const { userId, resolved } = useAuthUserId();
  const { projects } = useProjects();
  const teamProjectIds = useMyTeamProjectIds(userId);

  const candidateProjectIds = useMemo(() => {
    const general = (projects ?? [])
      .slice(0, CANDIDATE_LIMIT)
      .map((p) => p.id);
    return Array.from(new Set([...teamProjectIds, ...general]));
  }, [projects, teamProjectIds]);

  const maps = useAnyProjectPermission(
    "view_operations_maps",
    candidateProjectIds,
  );
  const contracts = useAnyProjectPermission(
    "view_operations_contracts",
    candidateProjectIds,
  );
  const boq = useAnyProjectPermission(
    "view_operations_boq",
    candidateProjectIds,
  );

  const items = useMemo(() => {
    return OPERATIONS_ITEMS.filter((item) => {
      if (item.path === "/operations/maps") return maps.can;
      if (item.path === "/operations/contracts") return contracts.can;
      if (item.path === "/operations/boq") return boq.can;
      return true; // settings keeps its own permission field, checked normally
    });
  }, [maps.can, contracts.can, boq.can]);

  return {
    items,
    loading: !resolved || maps.loading || contracts.loading || boq.loading,
  };
}
