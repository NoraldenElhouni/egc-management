import { PackageOpen, Paperclip, Settings, Sheet } from "lucide-react";
import MenuGrid, { MenuItem } from "../../components/ui/MenuGrid";
import { useAuth } from "../../hooks/useAuth";

const OperationsPage = () => {
  const { user, loading } = useAuth();

  const menuItems: MenuItem[] = [
    {
      label: "الخرائط",
      icon: PackageOpen,
      path: "/operations/maps",
      description: "عرض وإدارة الخرائط",
      role: ["Admin", "Engineer", "Manager"],
    },
    {
      label: "العقود",
      icon: Sheet,
      path: "/operations/contracts",
      description: "إدارة العقود والملفات",
      role: ["Admin", "Engineer", "Manager"],
    },
    {
      label: "حصر الكميات",
      icon: Paperclip,
      path: "/operations/boq",
      description: "إدارة حصر الكميات",
      role: ["Admin", "Engineer", "Manager"],
    },
    {
      label: "الإعدادات",
      icon: Settings,
      path: "/operations/settings",
      description: "إعدادات وحدة التشغيل",
      role: ["Admin", "Engineer", "Manager"],
    },
  ];

  return (
    <MenuGrid
      title="ادارة التشغيل"
      items={menuItems}
      userRole={user?.role}
      loading={loading}
      columns={{ base: 1, sm: 2, md: 3 }}
    />
  );
};

export default OperationsPage;
