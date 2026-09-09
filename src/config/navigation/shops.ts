import { Layers, Package, Shapes, Store, Tag } from "lucide-react";
import type { NavItem } from "./types";

export const SHOPS_ITEMS: NavItem[] = [
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
    // Issue #15: existed only on the menu page — absent from the
    // sidebar, whose item array didn't even have a permission field.
  },
];
