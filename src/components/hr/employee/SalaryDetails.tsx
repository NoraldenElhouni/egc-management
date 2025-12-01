import { Payroll } from "../../../types/global.type";
import { EmployeePayrollColumns } from "../../tables/columns/EmployeePayrollColumns";
import GenericTable from "../../tables/table";

const SalaryDetails = ({ payroll }: { payroll?: Payroll[] }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-800 mb-4">
        "تفاصيل الرواتب
      </h3>

      <div className="overflow-x-auto">
        {payroll?.length === 0 ? (
          <div className="text-gray-500">لا توجد سجلات رواتب لهذا الموظف.</div>
        ) : (
          <GenericTable
            data={payroll ?? []}
            columns={EmployeePayrollColumns}
            enableSorting
            enablePagination
            enableFiltering
            enableRowSelection
            showGlobalFilter
          />
        )}
      </div>
    </div>
  );
};

export default SalaryDetails;
