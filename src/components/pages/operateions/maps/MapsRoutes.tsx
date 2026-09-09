import { Routes, Route } from "react-router-dom";
import RequirePermission from "../../../auth/RequirePermission";
import OperationsMapsPage from "../../../../pages/operations/mpas/OperationsMapsPage";
import OperationsMapsProjectPage from "../../../../pages/operations/mpas/project/OperationsMapsProjectPage";

// view_operations_maps is project-scoped, so it can only be asked on a
// route that actually carries :projectId (RequirePermission reads it from
// useParams — see that component's own note on why a pathless wrapper
// can't do this). The index here is a project picker, not itself
// project-scoped, so it stays outside the guard; OperationsRoutes.tsx no
// longer gates "maps/*" at all, for the same reason.
export default function MapsRoutes() {
  return (
    <Routes>
      <Route index element={<OperationsMapsPage />} />
      <Route
        path="project/:projectId"
        element={<RequirePermission permission="view_operations_maps" />}
      >
        <Route index element={<OperationsMapsProjectPage />} />
      </Route>
    </Routes>
  );
}
