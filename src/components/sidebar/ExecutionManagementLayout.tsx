import SidebarLayout from "./SidebarLayout";
import { EXECUTION_ITEMS } from "../../config/navigation/execution";

const ExecutionManagementLayout = () => (
  <SidebarLayout
    title="إدارة علاقات العملاء"
    subtitle="إدارة العملاء والتواصل معهم"
    items={EXECUTION_ITEMS.filter((item) => item.showInSidebar !== false)}
  />
);

export default ExecutionManagementLayout;
