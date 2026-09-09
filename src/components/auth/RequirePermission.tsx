import { Outlet, useParams } from "react-router-dom";
import { useMyPermissions } from "../../hooks/permissions/useCan";

// =====================================================================
// PHASE 7C — the first real route guard in the desktop app
// =====================================================================
// Until now the only access control here was menu hiding. Every route
// was reachable by typing its URL: a user who could not see the
// "الإعدادات" card could still open #/settings/logs and read the audit
// log. Batches 4 and 5 made the menus honest; this makes the router
// honest too.
//
// WHAT THIS IS AND IS NOT. This is a UI guard. It stops navigation, not
// data access — the tables underneath are still readable by any
// authenticated session, because RLS is untouched and stays untouched.
// Anyone who opens devtools can still query what this hides. Closing
// that is an RLS phase, deliberately not this one.
//
// USED AS A LAYOUT ROUTE, so one guard covers a whole subtree:
//
//   <Route element={<RequirePermission permission="view_treasury" />}>
//     <Route path="treasury" element={<TreasuryPage />} />
//     <Route path="treasury/project/:id" element={<TreasuryProjectPage />} />
//   </Route>
//
// Nesting is fine and composes as AND: a section guard plus a tighter
// guard inside it means both must pass.
// =====================================================================

interface RequirePermissionProps {
  /** Allowed if this permission resolves true — or ANY of them, given an array. */
  permission?: string | string[];
  /**
   * Project id for project-scoped permissions. Usually omitted: when the
   * guard sits on a route whose path declares `:projectId`, that param is
   * picked up automatically. See the PROJECT-SCOPED note below.
   */
  projectId?: string;
}

const Denied = () => (
  <div className="max-w-lg mx-auto p-8 text-center" dir="rtl">
    <p className="text-sm text-gray-500">
      ليست لديك صلاحية الوصول إلى هذه الصفحة.
    </p>
  </div>
);

const RequirePermission = ({
  permission,
  projectId,
}: RequirePermissionProps) => {
  // PROJECT-SCOPED PERMISSIONS. A permission with is_project_scoped = true
  // resolves to false when asked without a project — correctly, per
  // phase2-resolver.sql DECISION 3, since "may you manage the team" is not
  // answerable until you say which team. Guards that named such a
  // permission and passed no project therefore denied EVERYONE, Admin
  // included: three routes shipped broken that way in issue #19 gap 4.
  //
  // So take the project from the URL when the route supplies one. React
  // Router only exposes a param to the element of a route whose own path
  // declares it, so this works when the guard is written as
  //
  //   <Route path="projects/:projectId" element={<RequirePermission ... />}>
  //
  // and NOT when it is a pathless wrapper around such a route. If you gate
  // on a project-scoped permission, the guard route must carry the param.
  //
  // Harmless for company-wide permissions: the resolver ignores project
  // context for those entirely (DECISION 6), so the answer is unchanged.
  const params = useParams<{ projectId?: string }>();
  const effectiveProjectId = projectId ?? params.projectId;

  const {
    data: allowed,
    isPending,
    isError,
  } = useMyPermissions(effectiveProjectId);

  if (!permission || (Array.isArray(permission) && permission.length === 0)) {
    return <Outlet />;
  }

  // Blank while resolving. Showing the page and pulling it away is worse
  // than a brief pause, and showing "denied" then revealing the page
  // reads as a bug.
  if (isPending) {
    return (
      <div className="p-8 text-center text-sm text-gray-400" dir="rtl">
        جاري التحقق من الصلاحية...
      </div>
    );
  }

  if (isError || !allowed) return <Denied />;

  const ok = Array.isArray(permission)
    ? permission.some((name) => allowed.has(name))
    : allowed.has(permission);

  return ok ? <Outlet /> : <Denied />;
};

export default RequirePermission;
