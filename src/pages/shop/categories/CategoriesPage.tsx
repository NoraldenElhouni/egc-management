import { useCategories } from "../../../hooks/shop/categories/useCategories";
import LoadingPage from "../../../components/ui/LoadingPage";
import ErrorPage from "../../../components/ui/errorPage";
import GenericTable from "../../../components/tables/table";
import { CategoriesColumns } from "../../../components/tables/columns/shops/categories/CategoriesColumns";

const CategoriesPage = () => {
  const { categories, error, loading } = useCategories();

  if (loading) return <LoadingPage />;
  if (error) return <ErrorPage error={error.message} />;

  return (
    <div className="p-4">
      <GenericTable
        data={categories}
        columns={CategoriesColumns}
        header={<h1 className="text-2xl font-bold text-gray-800">التصنيفات</h1>}
        link="./new"
        linkLabel="+ إضافة تصنيف جديد"
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

export default CategoriesPage;
