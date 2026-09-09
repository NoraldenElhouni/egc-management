import { ListTree } from "lucide-react";
import MenuGrid, { MenuItem } from "../../../components/ui/MenuGrid";

const OperationsSettingsPage = () => {
  const menuItems: MenuItem[] = [
    {
      label: "قوالب حصر الكميات",
      icon: ListTree,
      path: "/operations/settings/boq/templates",
      description: "إدارة القوالب العامة لأنواع وأعمال وبنود حصر الكميات",
    },
  ];

  return (
    <MenuGrid
      title="إعدادات التشغيل"
      items={menuItems}
      columns={{ base: 1, sm: 2, md: 3 }}
    />
  );
};

export default OperationsSettingsPage;
