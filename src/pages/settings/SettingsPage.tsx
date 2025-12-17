import { Box, Users } from "lucide-react";
import MenuGrid from "../../components/ui/MenuGrid";
import { useAuth } from "../../hooks/useAuth";

const SettingsPage = () => {
  const { user, loading } = useAuth();

  const menuItems = [
    {
      label: "اداره الادوار",
      icon: Users,
      path: "/settings/roles",
      description: "إدارة  الأدوار والصلاحيات",
    },
    {
      label: "اداره اسماء المصروفات",
      icon: Box,
      path: "/settings/expenses",
      description: "إدارة اسماء المصروفات",
    },
    {
      label: "اداره التخصصات",
      icon: Box,
      path: "/settings/specializations",
      description: "إدارة التخصصات",
    },
  ];

  return (
    <MenuGrid
      title="المالية"
      items={menuItems}
      userRole={user?.role}
      loading={loading}
      columns={{ base: 1, sm: 2, md: 3 }}
    />
  );
};

export default SettingsPage;
