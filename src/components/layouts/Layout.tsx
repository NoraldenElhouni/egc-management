// src/renderer/layouts/Layout.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../sidebar/sidebar";

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-primary">
      {/* Fixed sidebar sits outside the flow; offset the page content with ml-64 */}
      <Sidebar />

      <div className="flex flex-col min-h-screen mr-0 sm:mr-64">
        <header className="h-16 flex items-center px-4 border-b">
          <h1 className="text-lg font-medium">My App Header</h1>
        </header>

        <main className="flex-1 p-4 overflow-auto">
          <Outlet />
        </main>

        {/* <footer className="h-12 flex items-center px-4 bg-white border-t">
          <span className="text-sm text-slate-600">© 2025 My App</span>
        </footer> */}
      </div>
    </div>
  );
};

export default Layout;
