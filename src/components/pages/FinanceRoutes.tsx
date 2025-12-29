import { Routes, Route } from "react-router-dom";
import FinanceLayout from "../sidebar/FinanceLayout";
import FinancePage from "../../pages/finance/FinancePage";
import PayrollFinancePage from "../../pages/finance/payroll/PayrollFinancePage";
import AccountingPage from "../../pages/finance/accounting/AccountingPage";
import TreasuryPage from "../../pages/finance/treasury/TreasuryPage";
import TreasuryProjectPage from "../../pages/finance/treasury/TreasuryProjectPage";
import InvoicesPage from "../../pages/finance/invoices/ProjectsInvoicesPage";
import ProjectInvoicesDetailsPage from "../../pages/finance/invoices/ProjectInvoicesDetailsPage";
import PaymentsPage from "../../pages/finance/PaymentsPage";
import BookkeepingRoutes from "./BookkeepingRoutes";
import BookkeepingPage from "../../pages/finance/bookkeeper/BookkeepingPage";

const FinanceRoutes = () => {
  return (
    <Routes>
      {/* ✅ Bookkeeping section خارج FinanceLayout */}

      <Route path="bookkeeping/*" element={<BookkeepingRoutes />} />

      {/* ✅ باقي صفحات Finance داخل FinanceLayout */}
      <Route element={<FinanceLayout />}>
        <Route index element={<FinancePage />} />

        <Route path="payroll" element={<PayrollFinancePage />} />
        <Route path="accounting" element={<AccountingPage />} />
        <Route path="accounting/project/:id" element={<AccountingPage />} />

        <Route path="treasury" element={<TreasuryPage />} />
        <Route path="treasury/project/:id" element={<TreasuryProjectPage />} />

        <Route path="invoices" element={<InvoicesPage />} />
        <Route
          path="invoices/:projectId"
          element={<ProjectInvoicesDetailsPage />}
        />

        <Route path="payments" element={<PaymentsPage />} />
        <Route path="bookkeeping" element={<BookkeepingPage />} />
      </Route>
    </Routes>
  );
};

export default FinanceRoutes;
