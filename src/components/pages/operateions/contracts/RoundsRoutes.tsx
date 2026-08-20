import { Routes, Route } from "react-router-dom";
import NewRoundPage from "../../../../pages/operations/contracts/project/rounds/NewRoundPage";
import EditRoundPage from "../../../../pages/operations/contracts/project/rounds/EditRoundPage";
import RoundDetailsPage from "../../../../pages/operations/contracts/project/rounds/RoundDetailsPage";
import NewQuotePage from "../../../../pages/operations/contracts/project/rounds/quotes/NewQuotePage";
import QuoteDetailPage from "../../../../pages/operations/contracts/project/rounds/quotes/QuoteDetailPage";

export default function RoundsRoutes() {
  return (
    <Routes>
      <Route path="new" element={<NewRoundPage />} />
      <Route path=":roundId" element={<RoundDetailsPage />} />
      <Route path=":roundId/edit" element={<EditRoundPage />} />
      <Route path=":roundId/quotes/new" element={<NewQuotePage />} />
      <Route path=":roundId/quotes/:quoteId" element={<QuoteDetailPage />} />
    </Routes>
  );
}
