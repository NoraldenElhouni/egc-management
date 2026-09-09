import type { LucideIcon } from "lucide-react";
import type { PermissionGatedItem } from "../../hooks/permissions/useMenuPermissions";

/**
 * One entry, one gate, one list. The menu-grid page and the section
 * sidebar both render from the same NavItem[] (see finance.ts, settings.ts,
 * ...) instead of keeping two hand-maintained lists that can drift apart
 * on which destinations exist or how they're gated. See issue #15.
 */
export interface NavItem extends PermissionGatedItem {
  label: string;
  icon: LucideIcon;
  path: string;
  description?: string;
  badge?: number | string;
  disabled?: boolean;
  /** False keeps the item off the sidebar (e.g. a section's own "home" link). Default true. */
  showInSidebar?: boolean;
  /** False keeps the item off the menu grid page. Default true. */
  showInMenuGrid?: boolean;
}
