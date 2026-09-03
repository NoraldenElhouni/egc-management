import { Routes, Route } from "react-router-dom";
import RequirePermission from "../auth/RequirePermission";
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

      <Route element={<RequirePermission permission="view_bookkeeping" />}>
        <Route path="bookkeeping/*" element={<BookkeepingRoutes />} />
      </Route>

      {/* ✅ باقي صفحات Finance داخل FinanceLayout */}
      <Route element={<FinanceLayout />}>
        <Route
          element={
            <RequirePermission
              permission={[
                "view_bookkeeping",
                "view_company_finance",
                "view_payments",
                "view_treasury",
              ]}
            />
          }
        >
          <Route index element={<FinancePage />} />
        </Route>

        <Route element={<RequirePermission permission="view_treasury" />}>
          <Route path="treasury" element={<TreasuryPage />} />
          <Route
            path="treasury/project/:id"
            element={<TreasuryProjectPage />}
          />
        </Route>

        <Route
          element={<RequirePermission permission="view_company_finance" />}
        >
          <Route path="company" element={<CompanyPage />} />
          <Route
            path="company/expense/:expenseId"
            element={<ComapnyExpensePayments />}
          />
        </Route>

        <Route element={<RequirePermission permission="view_bookkeeping" />}>
          <Route path="bookkeeping" element={<BookkeepingPage />} />
        </Route>
        <Route element={<RequirePermission permission="view_projects" />}>
          <Route path="projects/add" element={<NewProjectFinance />} />
        </Route>
        <Route element={<RequirePermission permission="view_payments" />}>
          <Route path="payments" element={<NotPiadExpensePage />} />
        </Route>

        <Route element={<RequirePermission permission="view_payments" />}>
          <Route
            path="contractor-payments"
            element={<ContractorPaymentsPage />}
          />
          <Route path="tracking" element={<FinanceTrackingPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="contracts" element={<ContractsPage />} />
        </Route>

        {/* Left on its role check: overlaps the paused undistributed-expenses work. */}
        <Route element={<RequirePermission roles={["Admin", "Manager"]} />}>
          <Route
            path="pending-distribution"
            element={<UndistributedExpensePaymentsPage />}
          />
        </Route>
      </Route>
    </Routes>
  );
};

export default FinanceRoutes;
