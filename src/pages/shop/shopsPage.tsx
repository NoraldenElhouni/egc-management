import { useAuth } from "../../hooks/useAuth";
import MenuGrid, { MenuItem } from "../../components/ui/MenuGrid";
import { Layers, Tag, Shapes, Package, Store } from "lucide-react";

const ShopsPage = () => {
  const { user, loading } = useAuth();

  const menuItems: MenuItem[] = [
    {
      label: "الأقسام",
      icon: Layers,
      path: "/shops/divisions",
      description: "إدارة أقسام المحلات",
      role: [],
    },
    {
      label: "الفئات",
      icon: Tag,
      path: "/shops/categories",
      description: "إدارة فئات المنتجات",
      role: [],
    },
    {
      label: "الفئات الفرعية",
      icon: Shapes,
      path: "/shops/subcategories",
      description: "إدارة الفئات الفرعية",
      role: [],
    },
    {
      label: "المنتجات",
      icon: Package,
      path: "/shops/products",
      description: "إدارة المنتجات",
      role: [],
    },
    {
      label: "الموردون",
      icon: Store,
      path: "/shops/vendors",
      description: "إدارة الموردين",
      role: [],
    },
  ];

  return (
    <MenuGrid
      title="إدارة المحلات"
      items={menuItems}
      userRole={user?.role}
      loading={loading}
      columns={{ base: 1, sm: 2, md: 3 }}
    />
  );
};

export default ShopsPage;
