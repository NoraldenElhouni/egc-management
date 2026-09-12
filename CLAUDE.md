# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Shared backend

This app and the sibling Expo app at `../Fields` talk to the same Supabase project. Permissions, projects, contracts, payments, team assignments — all shared state, not duplicated per app. A schema or permission-catalog change here affects Fields too, and vice versa.

## Permissions architecture

Real access control is the `permission_catalog` / `can_i()` / `my_effective_permissions()` system defined in `../permissions/` at the repo root (`phase2-resolver.sql` is the resolver; `permission-code-audit.md` lists every existing permission and every place in code that references it — check it before assuming a permission doesn't exist or isn't used).

- `src/hooks/permissions/useCan.ts` — `useCan(permissionName, projectId?)`, the one gating hook. Backed by `useMyPermissions()`, which fetches the user's full effective-permission set ONCE per (user, project) and caches it, so many `useCan()` calls on one screen cost one round trip, not N.
- `src/components/auth/RequirePermission.tsx` — the route guard, used as a layout route: `<Route element={<RequirePermission permission="x" />}><Route path="y" element={<Page/>} /></Route>`. Nesting composes as AND.
- `permissionsDb` (`src/lib/permissionsDb.ts`) is not a second Supabase connection — it's the same client re-typed so tables/RPCs a schema migration added are visible to TypeScript before `npm run types` has been re-run. Same pattern exists in Fields as `newSchemaDb`.

**A project-scoped permission (`is_project_scoped = true`) asked without a `projectId` always denies** (phase2-resolver.sql DECISION 3) — this is correct behavior, not a bug, but it means a permission meant to gate "all projects at once" (like `view_all_project_teams`) must be company-wide (`is_project_scoped = false`), while a permission that answers "may you do X on THIS project" must be project-scoped and always asked with a project id. Check `permission_catalog.is_project_scoped` before choosing which shape a new permission needs — see `src/pages/execution-management/projects/AllProjectTeamsPage.tsx` for the canonical writeup of this distinction (company-wide list screen vs. per-project edit permission).

This is a UI guard, not RLS: it stops navigation, not queries. RLS underneath is unaffected by anything in this section.

## Adding a new page that needs access control

A new page is not "done" once it renders — it needs a permission wired to it, the same way every existing route does:

1. Decide the shape: company-wide (`is_project_scoped = false`) for a screen about everything at once, or project-scoped (`true`) for a screen about one project, per the DECISION 3 note above.
2. Add the permission to `permission_catalog` (coordinate via `../permissions/` — shared with Fields).
3. Wrap the route in `<RequirePermission permission="..." />` in the relevant `*Routes.tsx` file (e.g. `src/components/pages/ExecutionManagementRoutes.tsx`), or gate specific in-page actions with `useCan()` if only part of the page needs the check (see `AllProjectTeamsPage.tsx`'s per-card edit gating for that pattern).
4. If the page has a sidebar/menu entry (`src/config/navigation/*.ts`), give it a `permission` field there too, so it's hidden from the menu for anyone who doesn't have it — menu-hiding and route-guarding are two separate, both-required steps; one without the other either shows a dead link or leaves a page reachable only by typing the URL.
5. Track it in `../permissions/new-permissions-todo.md` until the catalog row actually exists in Supabase (that file is the running checklist — the code alone can't tell you which permissions are still only planned).
