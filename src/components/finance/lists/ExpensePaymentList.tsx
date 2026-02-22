import { useState } from "react";
import { projectExpensePayments } from "../../../types/extended.type";
import { formatCurrency } from "../../../utils/helpper";
import { ExpensePaymentsColumns } from "../../tables/columns/ExpensePaymentsColumns";
import GenericTable from "../../tables/table";

interface ExpensePaymentListProps {
  payment: projectExpensePayments[];
  totalPayments: number;
  deletePayment: (
    id: string,
  ) => Promise<{ success: boolean; error?: string | null }>;
  onEdit?: (p: projectExpensePayments) => void;
}

const ExpensePaymentList = ({
  payment,
  totalPayments,
  onEdit,
  deletePayment,
}: ExpensePaymentListProps) => {
  const [loading, setLoading] = useState(false);

  const onDelete = async (p: projectExpensePayments) => {
    if (!confirm("هل أنت متأكد من حذف هذه الدفعة؟ سيتم عكس الأرصدة.")) return;
    setLoading(true);
    try {
      const res = await deletePayment(p.id);
      if (!res.success) alert(res.error);
    } catch (error) {
      console.error("Error deleting payment:", error);
      alert("حدث خطأ أثناء حذف الدفعة. الرجاء المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };
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
          columns={ExpensePaymentsColumns({ onEdit, onDelete, loading })}
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
