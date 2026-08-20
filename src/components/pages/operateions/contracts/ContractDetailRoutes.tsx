import { Routes, Route } from "react-router-dom";
import NewMilestonePage from "../../../../pages/operations/contracts/project/contract/milestones/NewMilestonePage";
import EditMilestonePage from "../../../../pages/operations/contracts/project/contract/milestones/EditMilestonePage";
import MilestonePage from "../../../../pages/operations/contracts/project/contract/milestones/MilestonePage";
import ContractPaymentLogPage from "../../../../pages/operations/contracts/project/contract/payments/ContractPaymentLogPage";
import NewPaymentRequestPage from "../../../../pages/operations/contracts/project/contract/payments/NewPaymentRequestPage";

export default function ContractDetailRoutes() {
  return (
    <Routes>
      <Route path="milestones/new" element={<NewMilestonePage />} />
      <Route
        path="milestones/:milestoneId/edit"
        element={<EditMilestonePage />}
      />
      <Route path="milestones/:milestoneId" element={<MilestonePage />} />
      <Route path="payments" element={<ContractPaymentLogPage />} />
      <Route path="payments/new" element={<NewPaymentRequestPage />} />
    </Routes>
  );
}
