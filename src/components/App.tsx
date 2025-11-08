import React, { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import Dashboard from "./dashboard/dashboard";
import LoginForm from "./auth/LoginForm";
import Layout from "./layouts/Layout"; // 👈 import the wrapper
import ProjectDetail from "../pages/ProjectDetail";
import MainMenu from "../pages/MainMenu";
import ProjectsPage from "../pages/Projects";
import ExpensesPage from "../pages/Expenses";
import ReportsPage from "../pages/Reports";
import UsersPage from "../pages/Users";

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
        <Route element={<Layout />}>
          <Route path="/" element={<MainMenu />} />
          {/* Add more wrapped routes here */}
          {/* <Route path="/settings" element={<Settings />} /> */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/users" element={<UsersPage />} />
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
