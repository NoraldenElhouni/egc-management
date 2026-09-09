import SidebarLayout from "./SidebarLayout";
import { SETTINGS_ITEMS } from "../../config/navigation/settings";

const SettingsLayout = () => (
  <SidebarLayout
    title="الإعدادات"
    subtitle="إدارة إعدادات النظام"
    items={SETTINGS_ITEMS.filter((item) => item.showInSidebar !== false)}
  />
);

export default SettingsLayout;
