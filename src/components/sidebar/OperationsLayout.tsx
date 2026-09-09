import SidebarLayout from "./SidebarLayout";
import { OPERATIONS_ITEMS } from "../../config/navigation/operations";

const OperationsLayout = () => (
  <SidebarLayout
    title="الإعدادات"
    subtitle="إدارة إعدادات النظام"
    items={OPERATIONS_ITEMS.filter((item) => item.showInSidebar !== false)}
  />
);

export default OperationsLayout;
