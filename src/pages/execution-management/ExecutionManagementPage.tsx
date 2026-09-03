import { House } from "lucide-react";
import MenuGrid from "../../components/ui/MenuGrid";

const ExecutionManagementPage = () => {
  const menuItems = [
    {
      label: "إدارة المشاريع",
      icon: House,
      path: "./projects",
      description: "إدارة المشاريع",
      permission: "manage_execution",
    },
  ];

  return (
    <MenuGrid
      title="إدارة التنفيذ"
      items={menuItems}
      columns={{ base: 1, sm: 2, md: 3 }}
    />
  );
};

export default ExecutionManagementPage;
