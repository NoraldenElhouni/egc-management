import React, { useEffect, useRef, useState } from "react";
import { Menu, User } from "lucide-react";
import { signOutUser } from "../../lib/auth";
import { Link, useLocation } from "react-router-dom";

const Header = () => {
  const location = useLocation();

  // Derive a simple page title from the current pathname (you can replace with real routing metadata)
  const titleFromPath = (path: string) => {
    if (path === "/") return "اللوحة الرئيسية";
    if (path.startsWith("/projects/new")) return "إنشاء مشروع جديد";
    if (path.startsWith("/projects")) return "المشاريع";
    if (path.startsWith("/users")) return "المستخدمون";
    if (path.startsWith("/reports")) return "التقارير";
    if (path.startsWith("/profile")) return "الملف الشخصي";
    return "الصفحة";
  };
  const pageTitle = titleFromPath(location.pathname);

  const handleLogout = async () => {
    try {
      await signOutUser();
      // router or auth listener should redirect after sign-out
    } catch (err) {
      console.error("Logout failed", err);
    }
  };
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  // close dropdown on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  return (
    <header className="h-16 flex items-center justify-between px-4 border-b bg-white shadow-sm">
      {/* Left area: page title & breadcrumb */}
      <div className="flex items-center gap-4">
        {/* menu button for small screens (visual parity with Sidebar's own mobile UI) */}
        <button
          aria-label="فتح القائمة"
          className="sm:hidden inline-flex items-center p-2 rounded-lg hover:bg-slate-100 transition"
          onClick={() => {
            // Toggle the mobile sidebar via a global event. Sidebar listens for open/close/toggle.
            const evt = new CustomEvent("toggle-sidebar");
            window.dispatchEvent(evt);
          }}
          title="قائمة"
        >
          <Menu size={18} />
        </button>

        <div>
          <h1 className="text-lg font-semibold text-slate-800">{pageTitle}</h1>
        </div>
      </div>

      {/* Right area: search and profile */}
      <div className="flex items-center gap-3">
        <div ref={profileRef} className="relative">
          <button
            aria-haspopup="true"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen((s) => !s)}
            className="flex items-center gap-2 bg-white border rounded-full px-6 py-1 shadow-sm"
            title="الملف الشخصي"
          >
            <User size={16} />
            <div className="text-sm">
              <div className="font-medium">اسم المستخدم</div>
              <div className="text-xs text-slate-400">الدور</div>
            </div>
          </button>

          {profileOpen && (
            <div
              role="menu"
              aria-orientation="vertical"
              className="absolute right-0 top-full mt-2 w-44 bg-white border rounded-md shadow-lg z-50 py-1"
            >
              <Link
                to="/profile"
                onClick={() => setProfileOpen(false)}
                role="menuitem"
                className="block text-sm text-right px-3 py-2 hover:bg-slate-100"
              >
                الملف الشخصي
              </Link>

              <button
                role="menuitem"
                onClick={async () => {
                  setProfileOpen(false);
                  await handleLogout();
                }}
                className="w-full text-right text-sm px-3 py-2 hover:bg-slate-100"
              >
                تسجيل الخروج
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
