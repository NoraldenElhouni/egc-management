import { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import Dashboard from "./dashboard/dashboard";
import LoginForm from "./auth/LoginForm";
import MainMenu from "../pages/MainMenu";
import ProfilePage from "../pages/profile/profile";
import MainMenuLayout from "./layouts/MainMenuLayout";
import WebsitePage from "../pages/website/WebsitePage";
import { AuthProvider, useAuth } from "../hooks/useAuth";
import RequirePasswordChange from "./auth/RequirePasswordChange";
import ChangePasswordPage from "./auth/ChangePasswordPage";
import HRRoutes from "./pages/HRRoutes";
import CRMRoutes from "./pages/CRMRoutes";
import SupplyChainRoutes from "./pages/SupplyChainRoutes";
import ProjectsRoutes from "./pages/ProjectsRoutes";
import FinanceRoutes from "./pages/FinanceRoutes";
import SettingsRoutes from "./pages/SettingsRoutes";
import CompanyRoutes from "./pages/CompanyRoutes";

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
      },
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
      60 * 60 * 1000,
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
        <Route element={<RequirePasswordChange />}>
          <Route element={<MainMenuLayout />}>
            <Route path="/change-password" element={<ChangePasswordPage />} />
            <Route path="/" element={<MainMenu />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* HR */}
            <Route path="/hr/*" element={<HRRoutes />} />

            {/* CRM */}
            <Route path="/crm/*" element={<CRMRoutes />} />

            {/* Supply Chain */}
            <Route path="/supply-chain/*" element={<SupplyChainRoutes />} />

            {/* Projects */}
            <Route path="/projects/*" element={<ProjectsRoutes />} />

            {/* Finance */}
            <Route path="/finance/*" element={<FinanceRoutes />} />

            <Route path="/profile" element={<ProfilePage />} />

            {/* Settings */}
            <Route path="/settings/*" element={<SettingsRoutes />} />

            <Route path="/company/*" element={<CompanyRoutes />} />

            <Route path="/website" element={<WebsitePage />} />
          </Route>
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
