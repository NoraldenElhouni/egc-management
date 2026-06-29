import { useSubcategories } from "../../../hooks/shop/subcategories/useSubcategories";
import LoadingPage from "../../../components/ui/LoadingPage";
import ErrorPage from "../../../components/ui/errorPage";
import GenericTable from "../../../components/tables/table";
import { SubcategoriesColumns } from "../../../components/tables/columns/shops/subcategories/SubcategoriesColumns";

const SubcategoriesPage = () => {
  const { subcategories, error, loading } = useSubcategories();

  if (loading) return <LoadingPage />;
  if (error) return <ErrorPage error={error.message} />;

  return (
    <div className="p-4">
      <GenericTable
        data={subcategories}
        columns={SubcategoriesColumns}
        header={
          <h1 className="text-2xl font-bold text-gray-800">
            التصنيفات الفرعية
          </h1>
        }
        link="./new"
        linkLabel="+ إضافة تصنيف فرعي جديد"
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

export default SubcategoriesPage;
