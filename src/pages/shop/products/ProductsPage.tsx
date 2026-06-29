import { useProducts } from "../../../hooks/shop/products/useProducts";
import LoadingPage from "../../../components/ui/LoadingPage";
import ErrorPage from "../../../components/ui/errorPage";
import GenericTable from "../../../components/tables/table";
import { ProductsColumns } from "../../../components/tables/columns/shops/products/ProductsColumns";

const ProductsPage = () => {
  const { products, error, loading } = useProducts();

  if (loading) return <LoadingPage />;
  if (error) return <ErrorPage error={error.message} />;

  return (
    <div className="p-4">
      <GenericTable
        data={products}
        columns={ProductsColumns}
        header={<h1 className="text-2xl font-bold text-gray-800">المنتجات</h1>}
        link="./new"
        linkLabel="+ إضافة منتج جديد"
        pageSize={10}
        enableSorting
        enablePagination
        enableFiltering
        enableRowSelection
        showGlobalFilter
      />
    </div>
  );
};

export default ProductsPage;
