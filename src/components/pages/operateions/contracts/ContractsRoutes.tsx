import { Routes, Route } from "react-router-dom";
import RequirePermission from "../../../auth/RequirePermission";
import ContractsPage from "../../../../pages/operations/contracts/ContractsPage";
import ContractsProjectPage from "../../../../pages/operations/contracts/project/ContractsProjectPage";
import ContractDetailsPage from "../../../../pages/operations/contracts/project/contract/ContractDetailsPage";
import RoundsRoutes from "./RoundsRoutes";
import ContractDetailRoutes from "./ContractDetailRoutes";

// view_operations_contracts is project-scoped — see MapsRoutes.tsx for why
// the guard sits here, on the route that carries :projectId, rather than
// pathless above it. The index is a project picker and stays ungated.
export default function ContractsRoutes() {
  return (
    <Routes>
      <Route index element={<ContractsPage />} />
      <Route
        path="project/:projectId"
        element={<RequirePermission permission="view_operations_contracts" />}
      >
        <Route index element={<ContractsProjectPage />} />
        <Route path="rounds/*" element={<RoundsRoutes />} />
        {/* one route for the details page itself */}
        <Route path=":contractId" element={<ContractDetailsPage />} />
        {/* everything else scoped under a contract */}
        <Route path=":contractId/*" element={<ContractDetailRoutes />} />
      </Route>
    </Routes>
  );
}
