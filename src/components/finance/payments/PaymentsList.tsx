import { usePayments } from "../../../hooks/finance/usePayments";
import { createContractPaymentsColumns } from "../../tables/columns/ContractPaymentsColumns";
import { ProjectsExpensesColumns } from "../../tables/columns/ProjectExpenseColumns";
import GenericTable from "../../tables/table";
import { useMemo } from "react";

const PaymentsList = () => {
  const { payments, contractPayments, loading, error, refetch } = usePayments();

  const contractPaymentsColumns = useMemo(
    () => createContractPaymentsColumns({ onRefetch: refetch }),
    [refetch]
  );

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
        columns={contractPaymentsColumns}
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
