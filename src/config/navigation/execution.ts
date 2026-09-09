import { House, Users } from "lucide-react";
import type { NavItem } from "./types";

export const EXECUTION_ITEMS: NavItem[] = [
  {
    label: "إدارة المشاريع",
    icon: House,
    // Issue #15: the menu page used a relative "./projects" (a route
    // mismatch, not just a gating one) while the sidebar used the
    // absolute path. Absolute wins so both surfaces link to the same
    // place regardless of the current route.
    path: "/execution-management/projects",
    description: "إدارة المشاريع",
    // Issue #15: the sidebar had no gate at all (public) while the menu
    // page required manage_execution. Gated wins — the sidebar was the
    // one drifted from intent.
    permission: "manage_execution",
  },
  {
    label: "فرق المشاريع",
    icon: Users,
    path: "/execution-management/projects/teams",
    description: "كل المشاريع وأعضاء فرقها في صفحة واحدة",
    permission: "view_all_project_teams",
  },
];
