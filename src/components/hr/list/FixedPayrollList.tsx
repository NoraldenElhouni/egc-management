import { usePayroll } from "../../../hooks/usePayroll";
import { EmployeesColumns } from "../../tables/columns/EmployeesColumns";
import { FixedPayrollColumns } from "../../tables/columns/FixedPayrollColumns";
import GenericTable from "../../tables/table";
import Button from "../../ui/Button";

const FixedPayrollList = () => {
  const { fixed, fixedPayroll, loading, error } = usePayroll();

  if (loading) return <div>جاري التحميل...</div>;
  if (error) return <div>حدث خطأ: {error.message}</div>;
  return (
    <div className="p-4">
      <div className="m-2">
        <Button>إضافة راتب</Button>
      </div>
      <GenericTable
        data={fixedPayroll}
        columns={FixedPayrollColumns}
        enableSorting
        enableFiltering
        enableRowSelection
        showGlobalFilter
        header={<h2 className="text-xl font-bold">رواتب ثابتة</h2>}
      />
      <GenericTable
        data={fixed}
        columns={EmployeesColumns}
        enableSorting
        enableFiltering
        enableRowSelection
        showGlobalFilter
        header={<h2 className="text-xl font-bold">الموظفين رواتب الثابتة</h2>}
      />
    </div>
  );
};

export default FixedPayrollList;
