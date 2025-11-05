// src/renderer/components/Dashboard.tsx
import React from "react";
import { signOutUser } from "../../lib/auth";

const Dashboard = ({ session }: { session: any }) => {
  const handleLogout = async () => {
    await signOutUser();
    // The AppRouter's listener will catch the state change and redirect automatically
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Welcome, {session.user.email}!</h2>
      <p>You are logged in.</p>
      <button onClick={handleLogout}>Log Out</button>
    </div>
  );
};

export default Dashboard;
