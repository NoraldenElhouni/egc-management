import { House } from "lucide-react";
import MenuGrid from "../../components/ui/MenuGrid";
import { useAuth } from "../../hooks/useAuth";

const ExecutionManagementPage = () => {
  const { user, loading } = useAuth();

  const menuItems = [
    {
      label: "إدارة المشاريع",
      icon: House,
      path: "./projects",
      description: "إدارة المشاريع",
      role: ["Admin", "Manager"],
    },
  ];

  return (
    <MenuGrid
      title="إدارة التنفيذ"
      items={menuItems}
      userRole={user?.role}
      loading={loading}
      columns={{ base: 1, sm: 2, md: 3 }}
    />
  );
};

export default ExecutionManagementPage;
