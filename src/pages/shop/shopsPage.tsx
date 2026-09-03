import MenuGrid, { MenuItem } from "../../components/ui/MenuGrid";
import { Layers, Tag, Shapes, Package, Store } from "lucide-react";

const ShopsPage = () => {
  const menuItems: MenuItem[] = [
    {
      label: "الأقسام",
      icon: Layers,
      path: "/shops/divisions",
      description: "إدارة أقسام المحلات",
    },
    {
      label: "الفئات",
      icon: Tag,
      path: "/shops/categories",
      description: "إدارة فئات المنتجات",
    },
    {
      label: "الفئات الفرعية",
      icon: Shapes,
      path: "/shops/subcategories",
      description: "إدارة الفئات الفرعية",
    },
    {
      label: "المنتجات",
      icon: Package,
      path: "/shops/products",
      description: "إدارة المنتجات",
    },
    {
      label: "الموردون",
      icon: Store,
      path: "/shops/vendors",
      description: "إدارة الموردين",
    },
    {
      label: "الطلبات",
      icon: Store,
      path: "/shops/orders/projects",
      description: "إدارة الطلبات",
      permission: "view_shop_catalog",
    },
  ];

  return (
    <MenuGrid
      title="إدارة المحلات"
      items={menuItems}
      columns={{ base: 1, sm: 2, md: 3 }}
    />
  );
};

export default ShopsPage;
