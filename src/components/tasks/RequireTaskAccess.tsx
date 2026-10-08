import { Lock } from "lucide-react";
import { Outlet, useParams } from "react-router-dom";
import { useMyTaskAccess } from "../../hooks/tasks/useTaskAccess";
import { TaskListPageSkeleton } from "./TasksSkeletons";

// Route guards for the tasks module, modelled on auth/RequirePermission.tsx
// (layout routes; nest to AND). The module's outer guard is still
// view_tasks_section (the menu); these add the finer rules:
//   scope="edit-all"   global catalogs and templates admin: edit_all_tasks only
//   scope="space"      /space/:spaceId/settings: manage that space
// UI only. The database refuses the same writes regardless.

function Neutral() {
  return <TaskListPageSkeleton />;
}

function Denied() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-gray-500" dir="rtl">
      <Lock className="h-5 w-5 text-gray-300" />
      <span>ليس لديك صلاحية الوصول إلى هذه الصفحة</span>
    </div>
  );
}

// scope="browse"      cross-space views: view_all, or a level on at least one space
// scope="space-view"  /space/:spaceId: any level on that space (view or more)
export default function RequireTaskAccess({
  scope,
}: {
  scope: "edit-all" | "space" | "browse" | "space-view";
}) {
  const { spaceId } = useParams<{ spaceId: string }>();
  const { access, loading } = useMyTaskAccess();

  if (loading) return <Neutral />;
  let allowed = false;
  if (scope === "edit-all") allowed = !!access?.edit_all;
  else if (scope === "space") allowed = !!(spaceId && access?.spaces[spaceId]?.caps.manage);
  else if (scope === "space-view") allowed = !!(spaceId && access?.spaces[spaceId]);
  else allowed = !!access && (access.view_all || Object.keys(access.spaces).length > 0);
  return allowed ? <Outlet /> : <Denied />;
}
