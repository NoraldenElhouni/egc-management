// src/renderer/layouts/Layout.tsx
import React from "react";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <div className="app-layout">
      {/* Example global wrapper elements */}
      <header className="header">My App Header</header>

      <main className="content">
        {/* This is where the child route content will render */}
        <Outlet />
      </main>

      <footer className="footer">© 2025 My App</footer>
    </div>
  );
};

export default Layout;
