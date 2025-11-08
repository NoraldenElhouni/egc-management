import { LogOut, Menu, Search, User } from "lucide-react";
import { signOutUser } from "../../lib/auth";
import { useLocation } from "react-router-dom";

const Header = () => {
  const location = useLocation();

  // Derive a simple page title from the current pathname (you can replace with real routing metadata)
  const titleFromPath = (path: string) => {
    if (path === "/") return "اللوحة الرئيسية";
    if (path.startsWith("/projects")) return "المشاريع";
    if (path.startsWith("/users")) return "المستخدمون";
    if (path.startsWith("/reports")) return "التقارير";
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
  return (
    <header className="h-14 flex items-center justify-between px-4 border-b bg-white shadow-sm">
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
        <div className="flex items-center gap-2 bg-white border rounded-full px-6 py-1 shadow-sm">
          <User size={16} />
          <div className="text-sm">
            <div className="font-medium">اسم المستخدم</div>
            <div className="text-xs text-slate-400">الدور</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
