import React, { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import Dashboard from "./dashboard/dashboard";
import LoginForm from "./auth/LoginForm";
// import Layout from "./layouts/Layout"; // 👈 import the wrapper
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
          <Route path="/hr" element={<HrPage />} />
          <Route path="/crm" element={<CrmPage />} />
          <Route path="/supply-chain" element={<SupplyChainPage />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/projects/new" element={<NewProjectPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
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
