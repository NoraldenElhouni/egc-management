import { useParams } from "react-router-dom";
import ErrorPage from "../../../../components/ui/errorPage";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import GenericTable from "../../../../components/tables/table";
import { CompanyExpensePaymentsColumns } from "../../../../components/tables/columns/CompanyExpensePaymentsColumns";
import CompanyExpensePaymentsForm from "./CompanyExpensePaymentsForm";
import { useCompanyExpense } from "../../../../hooks/finance/useComapanyFinance";

const CompanyExpensePayments = () => {
  const { expenseId } = useParams<{ expenseId: string }>();

  if (!expenseId) {
    return <ErrorPage label="رقم المصروف غير صالح" />;
  }

  const { error, loading, expense, payments, addPayments, deletePayment } =
    useCompanyExpense(expenseId);

  const onDelete = async () => {
    console.log("delete");
  };
  const onEdit = async () => {
    console.log("edit");
  };

  if (error) {
    return <ErrorPage label="حدث خطأ أثناء تحميل البيانات" />;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-full">
        <LoadingSpinner />
      </div>
    );
  }

  const remaining = (expense?.amount ?? 0) - (expense?.amount_paid ?? 0);

  return (
    <div className="p-4">
      <CompanyExpensePaymentsForm
        expense_id={expense?.id ?? ""}
        remaining={remaining}
        onSubmit={addPayments}
      />
      <GenericTable
        data={payments}
        columns={CompanyExpensePaymentsColumns({ onEdit, onDelete, loading })}
        enableSorting
        enablePagination
        enableFiltering
        enableRowSelection
        showGlobalFilter
      />
    </div>
  );
};

export default CompanyExpensePayments;
