import { Routes, Route } from "react-router-dom";
import FinanceLayout from "../sidebar/FinanceLayout";
import FinancePage from "../../pages/finance/FinancePage";
import TreasuryPage from "../../pages/finance/treasury/TreasuryPage";
import TreasuryProjectPage from "../../pages/finance/treasury/TreasuryProjectPage";
import BookkeepingRoutes from "./BookkeepingRoutes";
import BookkeepingPage from "../../pages/finance/bookkeeper/BookkeepingPage";
import NewProjectFinance from "../../pages/finance/NewProjectFinance";
import CompanyPage from "../../pages/finance/company/CompanyPage";
import ComapnyExpensePayments from "../../pages/finance/company/payments/ComapnyExpensePayments";
import NotPiadExpensePage from "../../pages/finance/payments/NotPiadExpensePage";
import ContractorPaymentsPage from "../../pages/finance/payments/ContractorPaymentsPage";
import OrdersPage from "../../pages/finance/orders/OrdersPage";
import ContractsPage from "../../pages/finance/contracts/ContractsPage";
import FinanceTrackingPage from "../../pages/finance/FinanceTrackingPage";
import UndistributedExpensePaymentsPage from "../../pages/finance/UndistributedExpensePaymentsPage";

const FinanceRoutes = () => {
  return (
    <Routes>
      {/* ✅ Bookkeeping section خارج FinanceLayout */}

      <Route path="bookkeeping/*" element={<BookkeepingRoutes />} />

      {/* ✅ باقي صفحات Finance داخل FinanceLayout */}
      <Route element={<FinanceLayout />}>
        <Route index element={<FinancePage />} />

        <Route path="treasury" element={<TreasuryPage />} />
        <Route path="treasury/project/:id" element={<TreasuryProjectPage />} />

        <Route path="company" element={<CompanyPage />} />
        <Route
          path="company/expense/:expenseId"
          element={<ComapnyExpensePayments />}
        />

        <Route path="bookkeeping" element={<BookkeepingPage />} />
        <Route path="projects/add" element={<NewProjectFinance />} />
        <Route path="payments" element={<NotPiadExpensePage />} />
        <Route
          path="contractor-payments"
          element={<ContractorPaymentsPage />}
        />
        <Route path="tracking" element={<FinanceTrackingPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="contracts" element={<ContractsPage />} />
        <Route
          path="pending-distribution"
          element={<UndistributedExpensePaymentsPage />}
        />
      </Route>
    </Routes>
  );
};

export default FinanceRoutes;
