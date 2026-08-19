import { Routes, Route } from "react-router-dom";
import NewRequestPage from "../../../../pages/operations/contracts/project/requests/NewRequestPage";
import ContractRequestDetailsPage from "../../../../pages/operations/contracts/project/requests/ContractRequestDetailsPage";
import EditRequestPage from "../../../../pages/operations/contracts/project/requests/EditRequestPage";
import BidsListPage from "../../../../pages/operations/contracts/project/requests/bids/BidsListPage";
import BidDetailPage from "../../../../pages/operations/contracts/project/requests/bids/BidDetailPage";
export default function RequestsRoutes() {
  return (
    <Routes>
      <Route path="new" element={<NewRequestPage />} />
      <Route path=":requestId" element={<ContractRequestDetailsPage />} />
      <Route path=":requestId/edit" element={<EditRequestPage />} />
      <Route path=":requestId/bids" element={<BidsListPage />} />
      <Route path=":requestId/bids/:bidId" element={<BidDetailPage />} />
    </Routes>
  );
}
