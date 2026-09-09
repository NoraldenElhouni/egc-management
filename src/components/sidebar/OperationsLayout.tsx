import SidebarLayout from "./SidebarLayout";
import { useOperationsSectionItems } from "../../hooks/permissions/useOperationsSectionItems";

const OperationsLayout = () => {
  const { items } = useOperationsSectionItems();

  return (
    <SidebarLayout
      title="الإعدادات"
      subtitle="إدارة إعدادات النظام"
      items={items.filter((item) => item.showInSidebar !== false)}
    />
  );
};

export default OperationsLayout;
