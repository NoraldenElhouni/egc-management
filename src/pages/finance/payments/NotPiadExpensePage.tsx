import { NotPiadExpenseColumns } from "../../../components/tables/columns/NotPiadExpenseColumns";
import GenericTable from "../../../components/tables/table";
import ErrorPage from "../../../components/ui/errorPage";
import LoadingPage from "../../../components/ui/LoadingPage";
import { useNotPiadExpense } from "../../../hooks/finance/payments/useNotPiadExpense";
import { ExpenseWithProject } from "../../../types/projects.type";

const NotPiadExpensePage = () => {
  const { error, expenses, loading } = useNotPiadExpense();

  if (loading) return <LoadingPage />;
  if (error) return <ErrorPage />;
  return (
    <div className="p-4">
      <div>
        <GenericTable<ExpenseWithProject>
          enableFiltering
          showGlobalFilter
          enableSorting
          enableRowSelection
          data={expenses || []}
          columns={NotPiadExpenseColumns}
        />
      </div>
    </div>
  );
};

export default NotPiadExpensePage;
