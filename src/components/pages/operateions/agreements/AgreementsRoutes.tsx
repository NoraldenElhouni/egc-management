import { Routes, Route } from "react-router-dom";
import RequirePermission from "../../../auth/RequirePermission";
import OperationsAgreementsPage from "../../../../pages/operations/agreements/OperationsAgreementsPage";
import OperationsAgreementsProjectPage from "../../../../pages/operations/agreements/project/OperationsAgreementsProjectPage";

// Same shape as MapsRoutes.tsx: the index is a project picker (nothing
// project-specific to check), and view_project_agreements — project-scoped
// — is asked only on the branch that carries :projectId.
export default function AgreementsRoutes() {
  return (
    <Routes>
      <Route index element={<OperationsAgreementsPage />} />
      <Route
        path="project/:projectId"
        element={<RequirePermission permission="view_project_agreements" />}
      >
        <Route index element={<OperationsAgreementsProjectPage />} />
      </Route>
    </Routes>
  );
}
