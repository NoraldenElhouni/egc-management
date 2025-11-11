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
} from "lucide-react";

const MainMenu = () => {
  const handleLogout = async () => {
    await signOutUser();
    // AppRouter will handle redirection after logout
  };

  const menuItems = [
    {
      label: "إدارة الموظفين",
      icon: <Users />,
      path: "/hr",
      role: ["admin", "manager", "hr"],
    },
    {
      label: "إدارة العملاء",
      icon: <ShieldUser />,
      path: "/crm",
      role: ["admin", "manager", "crm"],
    },
    {
      label: "سلسلة التوريد",
      icon: <LinkIcon />,
      path: "/supply-chain",
      role: ["admin", "manager"],
    },
    {
      label: "المشاريع",
      icon: <MapPin />,
      path: "/projects",
      role: ["admin", "manager"],
    },
    {
      label: "المالية",
      icon: <DollarSign />,
      path: "/finance",
      role: ["admin", "manager", "finance", "bookkeeper", "accountant"],
    },
    { label: "الملف الشخصي", icon: <User />, path: "/profile" },
    { label: "الإعدادات", icon: <Settings />, path: "/settings" },
  ];

  return (
    <div
      className="flex items-center justify-center h-[calc(100vh-4rem)] bg-gray-50 overflow-hidden"
      dir="rtl"
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-right">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          القائمة الرئيسية
        </h1>

        <div className="space-y-3">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className="flex items-center justify-between bg-gray-100 hover:bg-blue-100 transition-colors rounded-xl p-3 text-gray-700"
            >
              <span className="text-lg">{item.label}</span>
              <span className="text-blue-500">{item.icon}</span>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 bg-red-500 text-white py-2 px-4 rounded-xl hover:bg-red-600 w-full transition-colors"
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
