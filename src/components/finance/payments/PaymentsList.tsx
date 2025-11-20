import { usePayments } from "../../../hooks/finance/usePayments";
import { ContractPaymentsColumns } from "../../tables/columns/ContractPaymentsColumns";
import { ProjectsExpensesColumns } from "../../tables/columns/ProjectExpenseColumns";
import GenericTable from "../../tables/table";

const PaymentsList = () => {
  const { payments, contractPayments, loading, error } = usePayments();

  if (loading) return <div>جاري التحميل...</div>;
  if (error) return <div>حدث خطأ: {error}</div>;
  return (
    <div>
      <GenericTable
        data={payments}
        columns={ProjectsExpensesColumns}
        enableSorting
        enablePagination
        enableFiltering
        enableRowSelection
        showGlobalFilter
      />
      <GenericTable
        data={contractPayments}
        columns={ContractPaymentsColumns}
        enableSorting
        enablePagination
        enableFiltering
        enableRowSelection
        showGlobalFilter
      />
    </div>
  );
};

export default PaymentsList;
