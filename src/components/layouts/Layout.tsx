// src/renderer/layouts/Layout.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../sidebar/sidebar";
import Header from "./header";
const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Sidebar (fixed on the right) */}
      <Sidebar />

      {/* Main content area — offset on desktop to make room for right sidebar (w-72) */}
      <div className="flex flex-col min-h-screen sm:mr-72">
        <Header />
        <main>
          {/* Page content outlet */}
          <Outlet />
        </main>

        {/* Optional footer (uncomment if needed) */}
        {/*
        <footer className="h-12 flex items-center px-4 bg-white border-t">
          <span className="text-sm text-slate-600">© 2025 My App</span>
        </footer>
        */}
      </div>
    </div>
  );
};

export default Layout;
