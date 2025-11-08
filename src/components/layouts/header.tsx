import { Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import ProfileDropdown from "./ProfileDropdown";

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
      <ProfileDropdown />
    </header>
  );
};

export default Header;
