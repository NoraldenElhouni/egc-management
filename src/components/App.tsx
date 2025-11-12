import { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import Dashboard from "./dashboard/dashboard";
import LoginForm from "./auth/LoginForm";
// import Layout from "./layouts/Layout";
import ProjectDetail from "../pages/projects/ProjectDetail";
import MainMenu from "../pages/MainMenu";
import ProjectsPage from "../pages/projects/Projects";
import NewProjectPage from "../pages/projects/NewProject";
import ProfilePage from "../pages/profile/profile";
import MainMenuLayout from "./layouts/MainMenuLayout";
import HrPage from "../pages/hr/HrPage";
import CrmPage from "../pages/crm/crmPage";
import FinancePage from "../pages/finance/FinancePage";
import SupplyChainPage from "../pages/supply-chain/SupplyChainPage";
import SettingsPage from "../pages/settings/SettingsPage";
import WebsitePage from "../pages/website/websitePage";
import NewEmployeePage from "../pages/hr/NewEmployeePage";
import PayrolePage from "../pages/hr/PayrolePage";
import LoansAdvancesPage from "../pages/hr/LoansAdvancesPage";
import AttendancePage from "../pages/hr/AttendancePage";
import AnnouncementsPage from "../pages/hr/AnnouncementsPage";
import RestPasswordPage from "../pages/hr/RestPasswordPage";
import EmployeesPage from "../pages/hr/employeesPage";
import EmployeeDetailsPage from "../pages/hr/EmployeeDetailsPage";
import ContractorPage from "../pages/supply-chain/ContractorPage";
import VendorsPage from "../pages/supply-chain/VendorsPage";
import AccountingPage from "../pages/finance/AccountingPage";
import BookkeepingPage from "../pages/finance/BookkeepingPage";
import TreasuryPage from "../pages/finance/TreasuryPage";
import PaymentsPage from "../pages/finance/PaymentsPage";
import CompanyPage from "../pages/finance/CompanyPage";

const AppRouter = () => {
  const [session, setSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(!!session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(!!session);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    // <AuthProvider>
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<LoginForm />} />

      {/* Protected routes with Layout wrapper */}
      {session && (
        <Route element={<MainMenuLayout />}>
          <Route path="/" element={<MainMenu />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* HR */}
          <Route path="/hr" element={<HrPage />} />
          <Route path="/hr/employees/new" element={<NewEmployeePage />} />
          <Route path="/hr/payroll" element={<PayrolePage />} />
          <Route path="/hr/loans-advances" element={<LoansAdvancesPage />} />
          <Route path="/hr/attendance" element={<AttendancePage />} />
          <Route path="/hr/announcements" element={<AnnouncementsPage />} />
          <Route path="/hr/rest-password" element={<RestPasswordPage />} />
          <Route path="/hr/employees" element={<EmployeesPage />} />
          <Route path="/hr/employees/:id" element={<EmployeeDetailsPage />} />

          {/* CRM */}
          <Route path="/crm" element={<CrmPage />} />

          {/* Supply Chain */}
          <Route path="/supply-chain" element={<SupplyChainPage />} />
          <Route
            path="/supply-chain/contractors"
            element={<ContractorPage />}
          />
          <Route path="/supply-chain/vendors" element={<VendorsPage />} />

          {/* Projects */}
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/projects/new" element={<NewProjectPage />} />
          <Route path="/projects" element={<ProjectsPage />} />

          {/* Finance */}
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/finance/accounting" element={<AccountingPage />} />
          <Route path="/finance/bookkeeping" element={<BookkeepingPage />} />
          <Route path="/finance/treasury" element={<TreasuryPage />} />
          <Route path="/finance/payments" element={<PaymentsPage />} />
          <Route path="/finance/company" element={<CompanyPage />} />

          {/* Profile & Settings */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Website */}
          <Route path="/website" element={<WebsitePage />} />
        </Route>
      )}

      {/* If not logged in, fallback to login */}
      {!session && <Route path="*" element={<LoginForm />} />}
    </Routes>
  );
};

const App = () => (
  <Router>
    <AppRouter />
  </Router>
);

export default App;
