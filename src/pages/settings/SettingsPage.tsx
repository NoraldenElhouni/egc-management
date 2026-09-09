import MenuGrid from "../../components/ui/MenuGrid";
import { SETTINGS_ITEMS } from "../../config/navigation/settings";

const SettingsPage = () => {
  const menuItems = SETTINGS_ITEMS.filter(
    (item) => item.showInMenuGrid !== false,
  );

  return (
    <MenuGrid
      title="الإعدادات"
      items={menuItems}
      columns={{ base: 1, sm: 2, md: 4 }}
    />
  );
};

export default SettingsPage;
