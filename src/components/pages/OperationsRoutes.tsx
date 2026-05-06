import { Routes, Route } from "react-router-dom";
import OperationsPage from "../../pages/operations/OperationsPage";
import OperationsMapsPage from "../../pages/operations/mpas/OperationsMapsPage";
import OperationsMapsProjectPage from "../../pages/operations/mpas/project/OperationsMapsProjectPage";
import ContractsPage from "../../pages/operations/contracts/ContractsPage";
import NewContractProject from "../../pages/operations/contracts/project/newContractProject";
import ContractsProjectPage from "../../pages/operations/contracts/project/ContractsProjectPage";
import OperationsLayout from "../sidebar/OperationsLayout";
import ContractRequestDetailsPage from "../../pages/operations/contracts/project/requests/ContractRequestDetailsPage";
import ContractDetailsPage from "../../pages/operations/contracts/project/contract/ContractDetailsPage";

export default function OperationsRoutes() {
  return (
    <Routes>
      <Route element={<OperationsLayout />}>
        <Route index element={<OperationsPage />} />

        {/* ✅ ADD THESE*/}
        {/* <Route path="manage" element={<OperationsManagePage />} /> */}
        <Route path="maps" element={<OperationsMapsPage />} />
        <Route
          path="maps/project/:projectId"
          element={<OperationsMapsProjectPage />}
        />
        <Route path="contracts" element={<ContractsPage />} />
        <Route
          path="contracts/project/:projectId"
          element={<ContractsProjectPage />}
        />
        <Route
          path="contracts/project/:projectId/new"
          element={<NewContractProject />}
        />
        <Route
          path="contracts/project/:projectId/contractId"
          element={<ContractDetailsPage />}
        />
        <Route
          path="contracts/project/:projectId/requests/:requestId"
          element={<ContractRequestDetailsPage />}
        />
      </Route>
    </Routes>
  );
}
