import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./header";

const MainMenuLayout = () => {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Main content area — offset on desktop to make room for right sidebar (w-72) */}
      <div>
        <Header />
        <main>
          {/* Page content outlet */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainMenuLayout;
