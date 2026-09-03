import { PackageOpen, Paperclip, Settings, Sheet } from "lucide-react";
import MenuGrid, { MenuItem } from "../../components/ui/MenuGrid";

const OperationsPage = () => {
  const menuItems: MenuItem[] = [
    {
      label: "الخرائط",
      icon: PackageOpen,
      path: "/operations/maps",
      description: "عرض وإدارة الخرائط",
      permission: "view_operations",
    },
    {
      label: "العقود",
      icon: Sheet,
      path: "/operations/contracts",
      description: "إدارة العقود والملفات",
      permission: "view_operations",
    },
    {
      label: "حصر الكميات",
      icon: Paperclip,
      path: "/operations/boq",
      description: "إدارة حصر الكميات",
      permission: "view_operations",
    },
    {
      label: "الإعدادات",
      icon: Settings,
      path: "/operations/settings",
      description: "إعدادات وحدة التشغيل",
      permission: "view_operations",
    },
  ];

  return (
    <MenuGrid
      title="ادارة التشغيل"
      items={menuItems}
      columns={{ base: 1, sm: 2, md: 3 }}
    />
  );
};

export default OperationsPage;
