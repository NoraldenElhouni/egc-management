import SidebarLayout from "./SidebarLayout";
import { SHOPS_ITEMS } from "../../config/navigation/shops";

const ShopsLayout = () => (
  <SidebarLayout
    title="المحلات"
    subtitle="إدارة متاجر التجارية"
    items={SHOPS_ITEMS.filter((item) => item.showInSidebar !== false)}
  />
);

export default ShopsLayout;
