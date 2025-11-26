import { useParams } from "react-router-dom";
import { useExpensePayments } from "../../../hooks/finance/usePayments";
import ExpensePaymentList from "../../../components/finance/lists/ExpensePaymentList";
import ExpensePaymentSummary from "../../../components/finance/cards/ExpensePaymentSummary";
import ExpensePaymentsForm from "../../../components/finance/form/ExpensePaymentsForm";

const ExpensePaymentsPage = () => {
  const { expenseId } = useParams<{ expenseId: string }>();
  const { error, loading, payment, expense, accounts } = useExpensePayments(
    expenseId ?? ""
  );

  const totalPayments = payment?.reduce((s, p) => s + (p.amount || 0), 0) || 0;
  const remaining = expense ? expense.total_amount - expense.amount_paid : 0;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-3 text-sm text-gray-600">
            جاري تحميل بيانات المصروف والمدفوعات...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="font-semibold text-red-800 mb-2">حدث خطأ</h2>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="p-6 text-center text-gray-600">المصروف غير موجود</div>
    );
  }

  if (!payment) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-3 text-sm text-gray-600">
            جاري تحميل بيانات المدفوعات...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header / Breadcrumb */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            المدفوعات للمصروف رقم {expense.serial_number ?? "-"}
          </h1>
          <p className="text-lg font-semibold">{expense.description}</p>
          <p className="text-sm text-gray-500">
            تاريخ المصروف: {new Date(expense.expense_date).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Expense Summary */}
      <ExpensePaymentSummary
        expense={expense}
        payment={payment.length}
        remaining={remaining}
      />

      <ExpensePaymentsForm
        expense={expense}
        accounts={accounts ?? []}
        remaining={remaining}
      />

      {/* Payments Table */}
      <ExpensePaymentList payment={payment} totalPayments={totalPayments} />
    </div>
  );
};

export default ExpensePaymentsPage;
