import { Route } from "react-router-dom";
import FinanceLayout from "../sidebar/FinanceLayout";
import FinancePage from "../../pages/finance/FinancePage";
import PayrollFinancePage from "../../pages/finance/payroll/PayrollFinancePage";
import CompanyPage from "../../pages/finance/CompanyPage";
import AccountingPage from "../../pages/finance/accounting/AccountingPage";
import TreasuryPage from "../../pages/finance/treasury/TreasuryPage";
import TreasuryProjectPage from "../../pages/finance/treasury/TreasuryProjectPage";
import InvoicesPage from "../../pages/finance/invoices/ProjectsInvoicesPage";
import ProjectInvoicesDetailsPage from "../../pages/finance/invoices/ProjectInvoicesDetailsPage";
import PaymentsPage from "../../pages/finance/PaymentsPage";
import BookkeepingPage from "../../pages/finance/bookkeeper/BookkeepingPage";

const FinanceRoutes = () => {
  return (
    <Route element={<FinanceLayout />}>
      <Route path="/finance" element={<FinancePage />} />
      <Route path="/finance/payroll" element={<PayrollFinancePage />} />
      <Route path="/finance/accounting" element={<AccountingPage />} />

      <Route path="/finance/accounting/project/:id" element={<CompanyPage />} />
      <Route path="/finance/treasury" element={<TreasuryPage />} />
      <Route
        path="/finance/treasury/project/:id"
        element={<TreasuryProjectPage />}
      />
      <Route path="/finance/invoices/" element={<InvoicesPage />} />
      <Route
        path="/finance/invoices/:projectId"
        element={<ProjectInvoicesDetailsPage />}
      />
      <Route path="/finance/payments" element={<PaymentsPage />} />
      <Route path="/finance/company" element={<CompanyPage />} />
      <Route path="/finance/bookkeeping" element={<BookkeepingPage />} />
    </Route>
  );
};

export default FinanceRoutes;
