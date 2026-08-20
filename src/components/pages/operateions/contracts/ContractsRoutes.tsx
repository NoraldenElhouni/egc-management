import { Routes, Route } from "react-router-dom";
import ContractsPage from "../../../../pages/operations/contracts/ContractsPage";
import ContractsProjectPage from "../../../../pages/operations/contracts/project/ContractsProjectPage";
import ContractDetailsPage from "../../../../pages/operations/contracts/project/contract/ContractDetailsPage";
import RoundsRoutes from "./RoundsRoutes";
import ContractDetailRoutes from "./ContractDetailRoutes";

export default function ContractsRoutes() {
  return (
    <Routes>
      <Route index element={<ContractsPage />} />
      <Route path="project/:projectId" element={<ContractsProjectPage />} />
      <Route
        path="project/:projectId/rounds/*"
        element={<RoundsRoutes />}
      />
      {/* one route for the details page itself */}
      <Route
        path="project/:projectId/:contractId"
        element={<ContractDetailsPage />}
      />
      {/* everything else scoped under a contract */}
      <Route
        path="project/:projectId/:contractId/*"
        element={<ContractDetailRoutes />}
      />
    </Routes>
  );
}
