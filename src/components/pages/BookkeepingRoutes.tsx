import { Route } from "react-router-dom";
import BookkeeperLayout from "../sidebar/BookkeeperLayout";
import ProjectBookDetailsPage from "../../pages/finance/bookkeeper/ProjectBookDetailsPage";
import BulkExpensesPage from "../../pages/finance/bookkeeper/Bulk/BulkExpensesPage";
import ExpensePaymentsPage from "../../pages/finance/bookkeeper/ExpensePaymentsPage";
import BookkeepingPage from "../../pages/finance/bookkeeper/BookkeepingPage";

const BookkeepingRoutes = () => {
  return (
    <Route element={<BookkeeperLayout />}>
      <Route
        path="/finance/bookkeeping/project/:id"
        element={<ProjectBookDetailsPage />}
      />
      <Route
        path="/finance/bookkeeping/project/:id/bulk-expenses"
        element={<BulkExpensesPage />}
      />
      <Route
        path="/finance/bookkeeping/project/:id/expense/:expenseId"
        element={<ExpensePaymentsPage />}
      />
      <Route
        path="/finance/bookkeeping/project/:id/expense/:expenseId/new"
        element={<ExpensePaymentsPage />}
      />
      <Route
        path="/finance/bookkeeping/projects"
        element={<BookkeepingPage />}
      />
    </Route>
  );
};

export default BookkeepingRoutes;
