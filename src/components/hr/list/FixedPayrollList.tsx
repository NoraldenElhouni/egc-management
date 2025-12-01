import { usePayroll } from "../../../hooks/usePayroll";
import { EmployeesColumns } from "../../tables/columns/EmployeesColumns";
import GenericTable from "../../tables/table";

const FixedPayrollList = () => {
  const { fixed, loading, error } = usePayroll();

  if (loading) return <div>جاري التحميل...</div>;
  if (error) return <div>حدث خطأ: {error.message}</div>;
  return (
    <div>
      <GenericTable
        data={fixed}
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

export default FixedPayrollList;
