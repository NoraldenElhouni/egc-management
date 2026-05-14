import { Routes, Route } from "react-router-dom";

import OperationsPage from "../../pages/operations/OperationsPage";
import OperationsMapsPage from "../../pages/operations/mpas/OperationsMapsPage";
import OperationsMapsProjectPage from "../../pages/operations/mpas/project/OperationsMapsProjectPage";
import ContractsPage from "../../pages/operations/contracts/ContractsPage";
import ContractsProjectPage from "../../pages/operations/contracts/project/ContractsProjectPage";
import NewContractProject from "../../pages/operations/contracts/project/newContractProject";
import ContractRequestDetailsPage from "../../pages/operations/contracts/project/requests/ContractRequestDetailsPage";
import ContractDetailsPage from "../../pages/operations/contracts/project/contract/ContractDetailsPage";
import OperationsLayout from "../sidebar/OperationsLayout";
import BidDetailPage from "../../pages/operations/contracts/project/requests/bids/BidDetailPage";
import BidsListPage from "../../pages/operations/contracts/project/requests/bids/BidsListPage";
import NewMilestonePage from "../../pages/operations/contracts/project/contract/milestones/NewMilestonePage";
import EditMilestonePage from "../../pages/operations/contracts/project/contract/milestones/EditMilestonePage";
import MilestoneReportsPage from "../../pages/operations/contracts/project/contract/milestones/MilestoneReportsPage";
import ContractPaymentLogPage from "../../pages/operations/contracts/project/contract/payments/ContractPaymentLogPage";
import NewPaymentRequestPage from "../../pages/operations/contracts/project/contract/payments/NewPaymentRequestPage";
import MilestonePage from "../../pages/operations/contracts/project/contract/milestones/MilestonePage";

// // ── Requests ──────────────────────────────────────────────────────────────────
// // TODO: create these pages
// import EditRequestPage from "../../pages/operations/contracts/project/requests/EditRequestPage"

export default function OperationsRoutes() {
  return (
    <Routes>
      <Route element={<OperationsLayout />}>
        {/* Index */}
        <Route index element={<OperationsPage />} />

        {/* Maps */}
        <Route path="maps" element={<OperationsMapsPage />} />
        <Route
          path="maps/project/:projectId"
          element={<OperationsMapsProjectPage />}
        />

        {/* ── Contracts root list ─────────────────────────────────────────── */}
        <Route path="contracts" element={<ContractsPage />} />

        {/* ── Per-project contracts list ──────────────────────────────────── */}
        <Route
          path="contracts/project/:projectId"
          element={<ContractsProjectPage />}
        />

        {/* ── New request ─────────────────────────────────────────────────── */}
        <Route
          path="contracts/project/:projectId/new"
          element={<NewContractProject />}
        />

        {/* ── Request details  ──────────────────────────────────────── */}
        <Route
          path="contracts/project/:projectId/requests/:requestId"
          element={<ContractRequestDetailsPage />}
        />

        {/* ── Bids ────────────────────────────────────────────────────────── */}
        <Route
          path="contracts/project/:projectId/requests/:requestId/bids"
          element={<BidsListPage />}
        />
        <Route
          path="contracts/project/:projectId/requests/:requestId/bids/:bidId"
          element={<BidDetailPage />}
        />

        {/* ── Contract details ─────────────────────────────────────────────
            NOTE: fixed the original route — was missing the colon on :contractId
        ───────────────────────────────────────────────────────────────────── */}
        <Route
          path="contracts/project/:projectId/:contractId"
          element={<ContractDetailsPage />}
        />

        {/* ── Milestones ──────────────────────────────────────────────────── */}
        <Route
          path="contracts/project/:projectId/:contractId/milestones/new"
          element={<NewMilestonePage />}
        />
        <Route
          path="contracts/project/:projectId/:contractId/milestones/:milestoneId/edit"
          element={<EditMilestonePage />}
        />
        <Route
          path="contracts/project/:projectId/:contractId/milestones/:milestoneId"
          element={<MilestonePage />}
        />
        <Route
          path="contracts/project/:projectId/:contractId/milestones/:milestoneId/reports"
          element={<MilestoneReportsPage />}
        />

        {/* ── Payments (per contract) ──────────────────────────────────────── */}
        <Route
          path="contracts/project/:projectId/:contractId/payments"
          element={<ContractPaymentLogPage />}
        />
        <Route
          path="contracts/project/:projectId/:contractId/payments/new"
          element={<NewPaymentRequestPage />}
        />
      </Route>
    </Routes>
  );
}
