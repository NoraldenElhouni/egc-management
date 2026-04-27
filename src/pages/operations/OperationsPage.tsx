import { PackageOpen, LucideIcon } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Link } from "react-router-dom";

type MenuItem = {
  label: string;
  icon: LucideIcon;
  path: string;
  role?: string[]; // 👈 optional
};

const OperationsPage = () => {
  const { user, loading } = useAuth();

  const menuItems: MenuItem[] = [
    // {
    //   label: "إدارة العمليات",
    //   icon: PackageOpen,
    //   path: "/operations/roles",
    //   role: ["Admin", "Manager"],
    // },
    {
      label: "الخرائط",
      icon: PackageOpen,
      path: "/operations/maps",
      role: [],
    },
  ];

  // Filter menu items based on the user's role. If an item has no `role` field it is public.
  const visibleItems = menuItems.filter((item) => {
    // Public item (no role defined or empty array)
    if (!item.role || item.role.length === 0) return true;

    // Still loading → show nothing restricted yet (optional behavior)
    if (loading) return true;

    // No user → hide restricted items
    if (!user?.role) return false;

    return item.role.includes(user.role);
  });

  return (
    <div className="h-full w-full p-6 mt-10 bg-background" dir="rtl">
      <h1 className="text-2xl font-bold mb-6 text-center text-foreground">
        ادارة التشغيل
      </h1>

      {/* Grid of cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-10">
        {visibleItems.map((item, index) => {
          const Icon = item.icon as LucideIcon;
          return (
            <Link
              key={index}
              to={item.path}
              className="flex flex-col items-center justify-center bg-gray-100 hover:bg-primary-superLight transition-colors rounded-2xl p-6 text-gray-700 text-center"
            >
              <div className="mb-3 text-primary">
                <Icon size={28} />
              </div>
              <span className="text-lg font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default OperationsPage;
