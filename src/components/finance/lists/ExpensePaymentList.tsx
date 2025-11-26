import { projectExpensePayments } from "../../../types/extended.type";
import { formatCurrency } from "../../../utils/helpper";
import { ExpensePaymentsColumns } from "../../tables/columns/ExpensePaymentsColumns";
import GenericTable from "../../tables/table";

interface ExpensePaymentListProps {
  payment: projectExpensePayments[];
  totalPayments: number;
}

const ExpensePaymentList = ({
  payment,
  totalPayments,
}: ExpensePaymentListProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">سجل المدفوعات</h2>
        <div className="text-sm text-gray-600">
          إجمالي المدفوعات المسجلة: {formatCurrency(totalPayments, "LYD")}
        </div>
      </div>
      {payment.length > 0 ? (
        <GenericTable
          data={payment}
          columns={ExpensePaymentsColumns}
          enableSorting
          enablePagination
          enableFiltering
          enableRowSelection
          showGlobalFilter
        />
      ) : (
        <p className="text-sm text-gray-500">
          لا توجد مدفوعات مسجلة لهذا المصروف
        </p>
      )}
    </div>
  );
};

export default ExpensePaymentList;
