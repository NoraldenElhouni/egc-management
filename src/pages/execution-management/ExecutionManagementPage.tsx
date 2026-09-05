import MenuGrid from "../../components/ui/MenuGrid";
import { EXECUTION_ITEMS } from "../../config/navigation/execution";

const ExecutionManagementPage = () => {
  const menuItems = EXECUTION_ITEMS.filter(
    (item) => item.showInMenuGrid !== false,
  );

  return (
    <MenuGrid
      title="إدارة التنفيذ"
      items={menuItems}
      columns={{ base: 1, sm: 2, md: 3 }}
    />
  );
};

export default ExecutionManagementPage;
