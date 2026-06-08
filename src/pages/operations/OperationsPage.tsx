import { PackageOpen, Paperclip } from "lucide-react";
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
      role: ["Admin"], // public
    },
    {
      label: "العقود",
      icon: Paperclip,
      path: "/operations/contracts",
      description: "إدارة العقود والملفات",
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
