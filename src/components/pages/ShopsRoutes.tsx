import { Route, Routes } from "react-router-dom";
import ShopsLayout from "../sidebar/ShopsLayout";
import ShopsPage from "../../pages/shop/shopsPage";
import DivisionsPage from "../../pages/shop/divisions/DivisionsPage";
import NewDivisionPage from "../../pages/shop/divisions/NewDivisionPage";
import DivisionDetailPage from "../../pages/shop/divisions/DivisionDetailPage";
import CategoriesPage from "../../pages/shop/categories/CategoriesPage";
import NewCategoryPage from "../../pages/shop/categories/NewCategoryPage";
import NewVendorPage from "../../pages/supply-chain/NewVendorPage";
import VendorDetailPage from "../../pages/supply-chain/VendorDetailPage";
import CategoryDetailPage from "../../pages/shop/categories/CategoryDetailPage";
import SubcategoriesPage from "../../pages/shop/subcategories/SubcategoriesPage";
import NewSubcategoryPage from "../../pages/shop/subcategories/NewSubcategoryPage";
import SubcategoryDetailPage from "../../pages/shop/subcategories/SubcategoryDetailPage";
import SubcategoryProductsPage from "../../pages/shop/subcategories/SubcategoryProductsPage";
import ProductsPage from "../../pages/shop/products/ProductsPage";
import NewProductPage from "../../pages/shop/products/NewProductPage";
import ProductDetailPage from "../../pages/shop/products/ProductDetailPage";
import ShopVendorsList from "../../pages/shop/vendors/ShopVendorsList";
import PorjectsOrdersPage from "../../pages/shop/orders/PorjectsOrdersPage";
import PorjectsOrdersDetailsPage from "../../pages/shop/orders/PorjectsOrdersDetailsPage";
import OrdersPage from "../../pages/shop/orders/OrdersPage";
import OrderDetailsPage from "../../pages/shop/orders/OrderDetailsPage";

export default function ShopsRoutes() {
  return (
    <Routes>
      <Route element={<ShopsLayout />}>
        {/* Index */}
        <Route index element={<ShopsPage />} />

        {/* ── Divisions ─────────────────────────────────────────────────── */}
        <Route path="divisions" element={<DivisionsPage />} />
        <Route path="divisions/new" element={<NewDivisionPage />} />
        <Route path="divisions/:divisionId" element={<DivisionDetailPage />} />

        {/* ── Categories ────────────────────────────────────────────────── */}
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="categories/new" element={<NewCategoryPage />} />
        <Route path="categories/:categoryId" element={<CategoryDetailPage />} />

        {/* ── Subcategories ─────────────────────────────────────────────── */}
        <Route path="subcategories" element={<SubcategoriesPage />} />
        <Route path="subcategories/new" element={<NewSubcategoryPage />} />
        <Route
          path="subcategories/:subcategoryId"
          element={<SubcategoryDetailPage />}
        />
        <Route
          path="subcategories/:subcategoryId/products"
          element={<SubcategoryProductsPage />}
        />

        {/* ── Products ──────────────────────────────────────────────────── */}
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<NewProductPage />} />
        <Route path="products/:productId" element={<ProductDetailPage />} />

        {/* ── Vendors ───────────────────────────────────────────────────── */}
        <Route path="vendors" element={<ShopVendorsList />} />
        <Route path="vendors/new" element={<NewVendorPage />} />
        <Route path="vendors/:vendorId" element={<VendorDetailPage />} />

        {/* ── orders ──────────────────────────────────────────────────── */}
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/projects" element={<PorjectsOrdersPage />} />
        <Route
          path="orders/project/:projectId"
          element={<PorjectsOrdersDetailsPage />}
        />
        <Route
          path="orders/project/:projectId/:orderId"
          element={<OrderDetailsPage />}
        />
      </Route>
    </Routes>
  );
}
