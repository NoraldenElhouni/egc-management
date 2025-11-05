// src/renderer/App.tsx
import React, { useState, useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import Dashboard from "./dashboard/dashboard";
import LoginForm from "./auth/LoginForm";

// A component to handle routing logic and state
const AppRouter = () => {
  const [session, setSession] = useState<any>(null); // State to hold the user session

  // Listen for authentication state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <Routes>
      {/* If a session exists, redirect to the dashboard. Otherwise, show the login page. */}
      <Route
        path="/"
        element={session ? <Dashboard session={session} /> : <LoginForm />}
      />
      <Route path="/login" element={<LoginForm />} />
      {/* Add other routes here if needed */}
    </Routes>
  );
};

const App = () => (
  <Router>
    <AppRouter />
  </Router>
);

export default App;
