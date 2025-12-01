import { usePayroll } from "../../../hooks/usePayroll";
import { EmployeesColumns } from "../../tables/columns/EmployeesColumns";
import GenericTable from "../../tables/table";

const PercentagesPayrollList = () => {
  const { percentage, loading, error } = usePayroll();

  if (loading) return <div>جاري التحميل...</div>;
  if (error) return <div>حدث خطأ: {error.message}</div>;
  return (
    <div>
      <GenericTable
        data={percentage}
        columns={EmployeesColumns}
        enableSorting
        enablePagination
        enableFiltering
        enableRowSelection
        showGlobalFilter
      />
    </div>
  );
};

export default PercentagesPayrollList;
