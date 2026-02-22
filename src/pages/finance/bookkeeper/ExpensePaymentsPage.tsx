import { useParams } from "react-router-dom";
import { useExpensePayments } from "../../../hooks/finance/usePayments";
import ExpensePaymentList from "../../../components/finance/lists/ExpensePaymentList";
import ExpensePaymentSummary from "../../../components/finance/cards/ExpensePaymentSummary";
import ExpensePaymentsForm from "../../../components/finance/form/ExpensePaymentsForm";
import GenericTable from "../../../components/tables/table";
import { ContractReportColumns } from "../../../components/tables/columns/ContractReportColumns";
import { useContractReport } from "../../../hooks/finance/useContractReport";
import { useState } from "react";
import type { projectExpensePayments } from "../../../types/extended.type";

import Button from "../../../components/ui/Button";
import DeleteExpenseDialog from "../../../components/finance/expense/DeleteExpenseDialog";
import ProjectExpenseEditForm from "../../../components/finance/form/ProjectExpenseEditForm";

const ExpensePaymentsPage = () => {
  const { expenseId } = useParams<{ expenseId: string }>();

  const [editingPayment, setEditingPayment] =
    useState<projectExpensePayments | null>(null);

  const [expenseEdit, setExpenseEdit] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { error, loading, payment, expense, accounts, deletePayment } =
    useExpensePayments(expenseId ?? "");

  const { report } = useContractReport(expenseId ?? "");

  const totalPayments = payment?.reduce((s, p) => s + (p.amount || 0), 0) || 0;
  const remaining = expense
    ? expense.total_amount - expense.amount_paid - (expense.discounting ?? 0)
    : 0;

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
      {/* Header */}
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

        <div className="flex items-center gap-3">
          {expenseEdit ? (
            <Button
              variant="primary-outline"
              onClick={() => setExpenseEdit(false)}
            >
              الغاء تعديل المصروف
            </Button>
          ) : (
            <Button
              variant="primary-light"
              onClick={() => setExpenseEdit(true)}
            >
              تعديل المصروف
            </Button>
          )}

          <Button variant="error" onClick={() => setDeleteOpen(true)}>
            حذف المصروف
          </Button>
        </div>
      </div>

      <DeleteExpenseDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        expense={{
          id: expense.id,
          serial_number: expense.serial_number,
          description: expense.description,
        }}
        currency={payment[0]?.accounts?.currency || null}
      />

      {/* Expense Summary */}
      <ExpensePaymentSummary
        expense={expense}
        payment={payment.length}
        remaining={remaining}
      />

      {!expenseEdit ? (
        <div>
          {/* Payments Form */}
          <ExpensePaymentsForm
            expense={expense}
            accounts={accounts ?? []}
            remaining={remaining}
            editingPayment={editingPayment}
            onCancelEdit={() => setEditingPayment(null)}
          />
          {/* Payments Table */}
          <ExpensePaymentList
            payment={payment}
            totalPayments={totalPayments}
            deletePayment={deletePayment}
            onEdit={(p) => setEditingPayment(p)}
          />
          {expense.contract_id && (
            <div>
              <h2 className="text-xl font-bold mb-4">تقرير العقد المرتبط</h2>
              <GenericTable
                data={report ?? []}
                columns={ContractReportColumns}
                enableSorting
                enablePagination
                enableFiltering
                enableRowSelection
                showGlobalFilter
              />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-lg font-bold mb-3">تعديل المصروف</h2>

          <ProjectExpenseEditForm
            projectId={expense.project_id}
            expense_id={expense.id}
            expense_type={expense.expense_type}
            phase={expense.phase}
            description={expense.description}
            total_amount={expense.total_amount}
            expense_date={expense.expense_date}
            contractor_id={expense.contractor_id}
            expense_ref_id={expense.expense_id}
            currency={expense.currency}
            vendor_id={expense.vendor_id}
          />
        </div>
      )}
    </div>
  );
};

export default ExpensePaymentsPage;
