import MenuGrid from "../../components/ui/MenuGrid";
import { OPERATIONS_ITEMS } from "../../config/navigation/operations";

const OperationsPage = () => {
  const menuItems = OPERATIONS_ITEMS.filter(
    (item) => item.showInMenuGrid !== false,
  );

  return (
    <MenuGrid
      title="ادارة التشغيل"
      items={menuItems}
      columns={{ base: 1, sm: 2, md: 3 }}
    />
  );
};

export default OperationsPage;
