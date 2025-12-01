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
import WebsitePage from "../pages/website/WebsitePage";
import NewEmployeePage from "../pages/hr/NewEmployeePage";
import LoansAdvancesPage from "../pages/hr/LoansAdvancesPage";
import AttendancePage from "../pages/hr/AttendancePage";
import AnnouncementsPage from "../pages/hr/AnnouncementsPage";
import RestPasswordPage from "../pages/hr/RestPasswordPage";
import EmployeesPage from "../pages/hr/EmployeesPage";
import EmployeeDetailsPage from "../pages/hr/EmployeeDetailsPage";
import ContractorPage from "../pages/supply-chain/ContractorPage";
import VendorsPage from "../pages/supply-chain/VendorsPage";
import AccountingPage from "../pages/finance/accounting/AccountingPage";
import BookkeepingPage from "../pages/finance/bookkeeper/BookkeepingPage";
import TreasuryPage from "../pages/finance/treasury/TreasuryPage";
import PaymentsPage from "../pages/finance/PaymentsPage";
import CompanyPage from "../pages/finance/CompanyPage";
import HRLayout from "./sidebar/HRLayout";
import SupplyChainLayout from "./sidebar/SupplyChainLayout";
import ProjectsLayout from "./sidebar/ProjectsLayout";
import FinanceLayout from "./sidebar/FinanceLayout";
import CRMLayout from "./sidebar/CRMLayout";
import { AuthProvider, useAuth } from "../hooks/useAuth";
import ContractorDetailPage from "../pages/supply-chain/ContractorDetailPage";
import VindorDetailPage from "../pages/supply-chain/VindorDetailPage";
import NewContractorPage from "../pages/supply-chain/NewContractorPage";
import NewVindorPage from "../pages/supply-chain/NewVindorPage";
import ClientDetailPage from "../pages/crm/ClientDetailPage";
import NewClientPage from "../pages/crm/NewClientPage";
import BookkeeperLayout from "./sidebar/BookkeeperLayout";
import ProjectBookDetailsPage from "../pages/finance/bookkeeper/ProjectBookDetailsPage";
import ExpensePaymentsPage from "../pages/finance/bookkeeper/ExpensePaymentsPage";
import TreasuryProjectPage from "../pages/finance/treasury/TreasuryProjectPage";
import PayrollPage from "../pages/hr/payroll/PayrollPage";
import MonthlyPayrollPage from "../pages/hr/payroll/MonthlyPayrollPage";
import PercentagesPayrollPage from "../pages/hr/payroll/PercentagesPayrollPage";
import MapsPayrollPage from "../pages/hr/payroll/MapsPayrollPage";

const AppRouter = () => {
  const [session, setSession] = useState(false);
  const { refreshUser } = useAuth();

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

  useEffect(() => {
    if (!session) return; // Only refresh when logged in

    const interval = setInterval(
      async () => {
        console.log("🔄 Auto-refreshing user data...");
        try {
          await refreshUser();
          console.log("✅ User data refreshed successfully");
        } catch (error) {
          console.error("❌ Failed to refresh user data:", error);
        }
      },
      60 * 60 * 1000
    ); // 1 hour = 60 minutes * 60 seconds * 1000 milliseconds

    return () => clearInterval(interval);
  }, [session, refreshUser]);

  // Optional: Also refresh when user returns to the tab
  useEffect(() => {
    if (!session) return;

    let lastRefresh = Date.now();

    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        const timeSinceLastRefresh = Date.now() - lastRefresh;
        const fifteenMinutes = 15 * 60 * 1000;

        // Only refresh if it's been more than 15 minutes
        if (timeSinceLastRefresh > fifteenMinutes) {
          console.log("👀 User returned, refreshing data...");
          await refreshUser();
          lastRefresh = Date.now();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [session, refreshUser]);

  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<LoginForm />} />

      {/* Protected routes with Layout wrapper */}
      {session && (
        <Route element={<MainMenuLayout />}>
          <Route path="/" element={<MainMenu />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* HR */}
          <Route element={<HRLayout />}>
            <Route path="/hr" element={<HrPage />} />
            <Route path="/hr/employees/new" element={<NewEmployeePage />} />
            <Route
              path="/hr/payroll/monthly"
              element={<MonthlyPayrollPage />}
            />
            <Route
              path="/hr/payroll/percentages"
              element={<PercentagesPayrollPage />}
            />
            <Route path="/hr/payroll/maps" element={<MapsPayrollPage />} />
            <Route path="/hr/payroll" element={<PayrollPage />} />
            <Route path="/hr/loans-advances" element={<LoansAdvancesPage />} />
            <Route path="/hr/attendance" element={<AttendancePage />} />
            <Route path="/hr/announcements" element={<AnnouncementsPage />} />
            <Route path="/hr/rest-password" element={<RestPasswordPage />} />
            <Route path="/hr/employees" element={<EmployeesPage />} />
            <Route path="/hr/employees/:id" element={<EmployeeDetailsPage />} />
            <Route path="/hr/employees/:id/edit" element={<EmployeesPage />} />
          </Route>

          {/* CRM */}
          <Route element={<CRMLayout />}>
            <Route path="/crm" element={<CrmPage />} />
            <Route path="/crm/clients/new" element={<NewClientPage />} />
            <Route path="/crm/clients/:id" element={<ClientDetailPage />} />
          </Route>

          {/* Supply Chain */}
          <Route element={<SupplyChainLayout />}>
            <Route path="/supply-chain" element={<SupplyChainPage />} />
            <Route
              path="/supply-chain/contractors"
              element={<ContractorPage />}
            />
            <Route
              path="/supply-chain/contractors/new"
              element={<NewContractorPage />}
            />
            <Route
              path="/supply-chain/contractors/:id"
              element={<ContractorDetailPage />}
            />
            <Route path="/supply-chain/vendors" element={<VendorsPage />} />
            <Route
              path="/supply-chain/vendors/new"
              element={<NewVindorPage />}
            />
            <Route
              path="/supply-chain/vendors/:id"
              element={<VindorDetailPage />}
            />
          </Route>

          {/* Projects */}
          <Route element={<ProjectsLayout />}>
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/new" element={<NewProjectPage />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
          </Route>

          {/* Finance */}
          <Route element={<FinanceLayout />}>
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/finance/accounting" element={<AccountingPage />} />
            <Route
              path="/finance/accounting/project/:id"
              element={<CompanyPage />}
            />
            <Route path="/finance/treasury" element={<TreasuryPage />} />
            <Route
              path="/finance/treasury/project/:id"
              element={<TreasuryProjectPage />}
            />
            <Route path="/finance/payments" element={<PaymentsPage />} />
            <Route path="/finance/company" element={<CompanyPage />} />
          </Route>
          <Route element={<BookkeeperLayout />}>
            <Route path="/finance/bookkeeping" element={<BookkeepingPage />} />
            <Route
              path="/finance/bookkeeping/projects/:id"
              element={<ProjectBookDetailsPage />}
            />
            <Route
              path="/finance/bookkeeping/projects/:id/expense/:expenseId"
              element={<ExpensePaymentsPage />}
            />
            <Route
              path="/finance/bookkeeping/projects/:id/expense/:expenseId/new"
              element={<ExpensePaymentsPage />}
            />
            <Route
              path="finance/bookkeeping/projects"
              element={<BookkeepingPage />}
            />
          </Route>

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
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </Router>
);

export default App;
