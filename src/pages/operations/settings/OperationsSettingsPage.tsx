import { ListTree } from "lucide-react";
import MenuGrid, { MenuItem } from "../../../components/ui/MenuGrid";
import { useAuth } from "../../../hooks/useAuth";

const OperationsSettingsPage = () => {
  const { user, loading } = useAuth();

  const menuItems: MenuItem[] = [
    {
      label: "قوالب حصر الكميات",
      icon: ListTree,
      path: "/operations/settings/boq/templates",
      description: "إدارة القوالب العامة لأنواع وأعمال وبنود حصر الكميات",
      role: [],
    },
  ];

  return (
    <MenuGrid
      title="إعدادات التشغيل"
      items={menuItems}
      userRole={user?.role}
      loading={loading}
      columns={{ base: 1, sm: 2, md: 3 }}
    />
  );
};

export default OperationsSettingsPage;
