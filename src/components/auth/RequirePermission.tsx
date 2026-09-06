import { Outlet } from "react-router-dom";
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
  /** Project id for project-scoped permissions. Rarely needed here. */
  projectId?: string;
}

const Denied = () => (
  <div className="max-w-lg mx-auto p-8 text-center" dir="rtl">
    <p className="text-sm text-gray-500">
      ليست لديك صلاحية الوصول إلى هذه الصفحة.
    </p>
  </div>
);

const RequirePermission = ({ permission, projectId }: RequirePermissionProps) => {
  const { data: allowed, isPending, isError } = useMyPermissions(projectId);

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
