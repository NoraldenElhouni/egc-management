import SidebarLayout from "./SidebarLayout";
import { FINANCE_ITEMS } from "../../config/navigation/finance";

const FinanceLayout = () => (
  <SidebarLayout
    title="المالية"
    subtitle="إدارة الشؤون المالية والمحاسبية"
    items={FINANCE_ITEMS.filter((item) => item.showInSidebar !== false)}
  />
);

export default FinanceLayout;
