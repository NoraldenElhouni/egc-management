import { Link } from "react-router-dom";
import { signOutUser } from "../lib/auth";
import {
  LogOut,
  Users,
  MapPin,
  DollarSign,
  LinkIcon,
  ShieldUser,
  User,
  Settings,
  Globe,
} from "lucide-react";
import { getProfile } from "../services/profile/getProfile";
import { useEffect, useState } from "react";

const MainMenu = () => {
  const [profile, setProfile] = useState<{ name: string; role: string } | null>(
    null
  );

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (err) {
        console.error("Failed to fetch profile", err);
        setProfile(null);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await signOutUser();
  };

  const menuItems = [
    {
      label: "إدارة الموظفين",
      icon: <Users />,
      path: "/hr",
      role: ["Admin", "Manager", "HR"],
    },
    {
      label: "إدارة العملاء",
      icon: <ShieldUser />,
      path: "/crm",
      role: ["Admin", "Manager", "Sales", "Support"],
    },
    {
      label: "سلسلة التوريد",
      icon: <LinkIcon />,
      path: "/supply-chain",
      role: ["Admin", "Manager"],
    },
    {
      label: "المشاريع",
      icon: <MapPin />,
      path: "/projects",
      role: ["Admin", "Manager"],
    },
    {
      label: "المالية",
      icon: <DollarSign />,
      path: "/finance",
      role: ["Admin", "Manager", "Finance", "Bookkeeper", "Accountant"],
    },
    { label: "الملف الشخصي", icon: <User />, path: "/profile" },
    { label: "الإعدادات", icon: <Settings />, path: "/settings" },
    {
      label: "الموقع الإلكتروني",
      icon: <Globe />,
      path: "/website",
      role: ["Admin", "Manager"],
    },
  ];

  // Filter menu items based on the user's role. If an item has no `role` field it is public.
  const visibleItems = menuItems.filter((item) => {
    if (!item.role) return true;
    if (!profile || !profile.role) return false;
    return item.role.includes(profile.role);
  });

  return (
    <div
      className="flex items-center justify-center h-full w-full mt-10 bg-background"
      dir="rtl"
    >
      <div className="bg-card rounded-2xl shadow-xl p-8 w-full max-w-md text-right">
        <h1 className="text-2xl font-bold mb-6 text-center text-foreground">
          القائمة الرئيسية
        </h1>

        <div className="space-y-3">
          {visibleItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className="flex items-center justify-between bg-gray-100 hover:bg-primary-superLight transition-colors rounded-xl p-3 text-gray-700"
            >
              <span className="text-lg">{item.label}</span>
              <span className="text-primary">{item.icon}</span>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 bg-error text-white py-2 px-4 rounded-xl hover:bg-error-dark w-full transition-colors"
          >
            <LogOut size={18} />
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
