import { useEffect, useRef, useState } from "react";
import { User } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const ProfileDropdown = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
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
            <div className="font-medium">{user?.name || "اسم المستخدم"}</div>
            <div className="text-xs text-slate-400">
              {user?.role || "الدور"}
            </div>
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
  );
};

export default ProfileDropdown;
