import { usePayroll } from "../../../hooks/usePayroll";
import { EmployeesColumns } from "../../tables/columns/EmployeesColumns";
import { PercentagesPayrollColumns } from "../../tables/columns/PercentagesPayrollColumns";
import GenericTable from "../../tables/table";
import Button from "../../ui/Button";

const PercentagesPayrollList = () => {
  const { percentage, percentagePayroll, loading, error } = usePayroll();

  if (loading) return <div>جاري التحميل...</div>;
  if (error) return <div>حدث خطأ: {error.message}</div>;
  return (
    <div className="p-4">
      <div className="m-2">
        <Button>إضافة راتب</Button>
      </div>
      <GenericTable
        data={percentagePayroll}
        columns={PercentagesPayrollColumns}
        enableSorting
        enableFiltering
        enableRowSelection
        showGlobalFilter
        header={<h2 className="text-xl font-bold">رواتب النسب</h2>}
      />
      <GenericTable
        data={percentage}
        columns={EmployeesColumns}
        enableSorting
        enableFiltering
        enableRowSelection
        showGlobalFilter
        header={<h2 className="text-xl font-bold">الموظفين رواتب النسب</h2>}
      />
    </div>
  );
};

export default PercentagesPayrollList;
