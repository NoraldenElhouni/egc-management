import { Routes, Route } from "react-router-dom";
import BookkeeperLayout from "../sidebar/BookkeeperLayout";
import ProjectBookDetailsPage from "../../pages/finance/bookkeeper/ProjectBookDetailsPage";
import BulkExpensesPage from "../../pages/finance/bookkeeper/Bulk/BulkExpensesPage";
import ExpensePaymentsPage from "../../pages/finance/bookkeeper/ExpensePaymentsPage";
import BookkeepingPage from "../../pages/finance/bookkeeper/BookkeepingPage";
import ExpenseEditPage from "../../pages/finance/bookkeeper/ExpenseEditPage";

const BookkeepingRoutes = () => {
  return (
    <Routes>
      <Route element={<BookkeeperLayout />}>
        <Route path="projects" element={<BookkeepingPage />} />

        <Route path="project/:id" element={<ProjectBookDetailsPage />} />
        <Route
          path="project/:id/bulk-expenses"
          element={<BulkExpensesPage />}
        />
        <Route
          path="project/:id/expense/:expenseId"
          element={<ExpensePaymentsPage />}
        />
        <Route
          path="project/:id/expense/:expenseId/edit"
          element={<ExpenseEditPage />}
        />
        <Route
          path="project/:id/expense/:expenseId/new"
          element={<ExpensePaymentsPage />}
        />
      </Route>
    </Routes>
  );
};

export default BookkeepingRoutes;
