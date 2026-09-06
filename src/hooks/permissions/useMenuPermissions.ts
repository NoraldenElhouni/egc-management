import { useMemo } from "react";
import { useMyPermissions } from "./useCan";

// =====================================================================
// PHASE 7B BATCHES 4 & 5 — one filter for every menu in the app
// =====================================================================
// Ten sidebar layouts, MenuGrid, MainMenu and CompanyPage each carried
// their own copy of this filter:
//
//     const visibleItems = menuItems.filter((item) => {
//       const roles = (item as { role?: string[] }).role;
//       if (!roles || loading) return true;
//       if (!user || !user.role) return false;
//       return roles.includes(user.role);
//     });
//
// Twelve copies, and they had already drifted apart — some treated an
// empty array as public, some did not; some showed everything while auth
// loaded, some showed nothing. That drift is exactly how the sidebar and
// the menu page ended up disagreeing about who may open /finance/treasury.
// There is now one implementation and one answer.
//
// COST: one resolver round trip per screen, no matter how many items are
// on it. useMyPermissions caches under a shared React Query key, so a
// sidebar with eight gated entries and the menu grid beside it share a
// single request.
//
// WHILE LOADING, SHOW NOTHING GATED. The old code showed everything, so
// a restricted item flashed on screen before disappearing. Public items
// (no `permission`) still render immediately — they never needed an
// answer.
// =====================================================================

export interface PermissionGatedItem {
  /**
   * The permission required to see this item.
   *
   * - omitted → public, always visible
   * - a string → must be allowed
   * - an array → allowed if ANY of them is (OR, not AND)
   *
   * The array form exists for section landing pages. /settings is
   * reachable by anyone who can reach something inside it, which is a
   * genuine OR and not a permission of its own — inventing
   * `view_settings` would mean maintaining a permission whose only job
   * is to be kept in sync with nine others.
   */
  permission?: string | string[];
}

/**
 * Filter a menu definition down to what the current user may see.
 *
 * `projectId` is for project-scoped permissions. Almost every desktop
 * menu is company-wide and should leave it undefined — but note that a
 * project-scoped permission asked without a project always denies
 * (phase2-resolver.sql DECISION 3), so gating a company-wide menu item
 * on one hides it from everybody, Admin included. Check
 * permission_catalog.is_project_scoped before adding a gate here.
 */
// `T extends object` rather than `T extends PermissionGatedItem`:
// PermissionGatedItem has only an optional member, which makes it a weak
// type, and TypeScript rejects a menu item that happens to set no
// `permission` at all — i.e. every fully public menu. The field is read
// through a narrowing cast below instead.
export function useVisibleMenuItems<T extends object>(
  items: T[],
  projectId?: string,
): { visibleItems: T[]; loading: boolean } {
  const { data: allowed, isPending } = useMyPermissions(projectId);

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      const { permission: required } = item as PermissionGatedItem;

      if (!required || (Array.isArray(required) && required.length === 0)) {
        return true;
      }

      if (!allowed) return false;
      return Array.isArray(required)
        ? required.some((name) => allowed.has(name))
        : allowed.has(required);
    });
  }, [items, allowed]);

  return { visibleItems, loading: isPending };
}
