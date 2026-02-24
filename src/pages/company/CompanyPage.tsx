import React, { ComponentType } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Users } from "lucide-react";
import { Link } from "react-router-dom";

const CompanyPage = () => {
  const { user, loading } = useAuth();
  // Use icon components (not JSX elements) so we can control size/class easily when rendering cards
  const menuItems = [
    {
      label: "إدارة الموظفين",
      icon: Users,
      path: "/hr",
      role: ["Admin", "Manager", "HR"],
    },
  ];

  // Filter menu items based on the user's role. If an item has no `role` field it is public.
  const visibleItems = menuItems.filter((item) => {
    if (!item.role || loading) return true;
    if (!user || !user.role) return false;
    return item.role.includes(user.role);
  });
  return (
    <div className="h-full w-full p-6 mt-10 bg-background" dir="rtl">
      <h1 className="text-2xl font-bold mb-6 text-center text-foreground">
        القائمة الرئيسية
      </h1>

      {/* Grid of cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-10">
        {visibleItems.map((item, index) => {
          const Icon = item.icon as ComponentType<{
            size?: number;
            className?: string;
          }>;
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

export default CompanyPage;
