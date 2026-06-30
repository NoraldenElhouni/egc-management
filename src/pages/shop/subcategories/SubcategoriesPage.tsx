import { useMemo } from "react";
import { useSubcategories } from "../../../hooks/shop/subcategories/useSubcategories";
import { useCategories } from "../../../hooks/shop/categories/useCategories";
import LoadingPage from "../../../components/ui/LoadingPage";
import ErrorPage from "../../../components/ui/errorPage";
import GenericTable from "../../../components/tables/table";
import { getSubcategoriesColumns } from "../../../components/tables/columns/shops/subcategories/SubcategoriesColumns";

const SubcategoriesPage = () => {
  const { subcategories, error, loading, toggleSubcategoryActive } =
    useSubcategories();
  const { categories } = useCategories();

  const categoryNameById = useMemo(
    () =>
      categories.reduce<Record<string, string>>((acc, c) => {
        acc[c.id] = c.name;
        return acc;
      }, {}),
    [categories],
  );

  const columns = useMemo(
    () => getSubcategoriesColumns(toggleSubcategoryActive, categoryNameById),
    [toggleSubcategoryActive, categoryNameById],
  );

  if (loading) return <LoadingPage />;
  if (error) return <ErrorPage error={error.message} />;

  return (
    <div className="p-4">
      <GenericTable
        data={subcategories}
        columns={columns}
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
