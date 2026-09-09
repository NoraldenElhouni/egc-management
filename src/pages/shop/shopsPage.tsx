import MenuGrid from "../../components/ui/MenuGrid";
import { SHOPS_ITEMS } from "../../config/navigation/shops";

const ShopsPage = () => {
  const menuItems = SHOPS_ITEMS.filter(
    (item) => item.showInMenuGrid !== false,
  );

  return (
    <MenuGrid
      title="إدارة المحلات"
      items={menuItems}
      columns={{ base: 1, sm: 2, md: 3 }}
    />
  );
};

export default ShopsPage;
