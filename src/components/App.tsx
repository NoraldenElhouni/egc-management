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
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<LoginForm />} />

      {/* Protected routes with Layout wrapper */}
      {session && (
        <Route element={<MainMenuLayout />}>
          <Route path="/" element={<MainMenu />} />
          {/* Add more wrapped routes here */}
          {/* <Route path="/settings" element={<Settings />} /> */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/hr" element={<MainMenu />} />
          <Route path="/crm" element={<MainMenu />} />
          <Route path="/supply-chain" element={<MainMenu />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/projects/new" element={<NewProjectPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/finance" element={<MainMenu />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<MainMenu />} />
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
