// src/renderer/components/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { signOutUser } from "../../lib/auth";
import { supabase } from "../../lib/supabaseClient";

const Dashboard = () => {
  const [session, setSession] = useState<any>(); // State to hold the user session

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

  const handleLogout = async () => {
    await signOutUser();
    // The AppRouter's listener will catch the state change and redirect automatically
  };

  return (
    <div className="bg-green-200" style={{ padding: "20px" }}>
      <h2>اهلا {session?.user?.email}!</h2>
      <p>لقد قمت بتسجيل الدخول.</p>
      <button onClick={handleLogout}>تسجيل الخروج</button>
    </div>
  );
};

export default Dashboard;
