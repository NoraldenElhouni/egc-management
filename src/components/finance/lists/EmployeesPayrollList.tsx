import { usePayroll } from "../../../hooks/usePayroll";
import { PayrollColumns } from "../../tables/columns/PayrollColumns";
import GenericTable from "../../tables/table";

const EmployeesPayrollList = () => {
  const { payroll, loading, error } = usePayroll();

  if (loading) return <div>جاري التحميل...</div>;
  if (error) return <div>حدث خطأ: {error.message}</div>;
  return (
    <div className="p-4">
      <GenericTable
        data={payroll}
        columns={PayrollColumns}
        enableSorting
        enableFiltering
        enableRowSelection
        showGlobalFilter
        header={<h2 className="text-xl font-bold">رواتب الموظفين</h2>}
      />
    </div>
  );
};

export default EmployeesPayrollList;
