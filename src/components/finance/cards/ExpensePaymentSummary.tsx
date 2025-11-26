import React from "react";
import { formatCurrency } from "../../../utils/helpper";
import { ProjectExpenses } from "../../../types/global.type";

interface ExpensePaymentSummaryProps {
  expense: ProjectExpenses;
  payment: number;
  remaining: number;
}

const ExpensePaymentSummary = ({
  expense,
  payment,
  remaining,
}: ExpensePaymentSummaryProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <p className="text-xs text-gray-500 mb-1">إجمالي قيمة المصروف</p>
        <p className="text-lg font-semibold text-gray-900">
          {formatCurrency(expense.total_amount, "LYD")}
        </p>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-4">
        <p className="text-xs text-gray-500 mb-1">المدفوع حتى الآن</p>
        <p className="text-lg font-semibold text-green-600">
          {formatCurrency(expense.amount_paid, "LYD")}
        </p>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-4">
        <p className="text-xs text-gray-500 mb-1">المتبقي</p>
        <p className="text-lg font-semibold text-blue-600">
          {formatCurrency(remaining, "LYD")}
        </p>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-4">
        <p className="text-xs text-gray-500 mb-1">عدد المدفوعات</p>
        <p className="text-lg font-semibold text-gray-900">{payment || 0}</p>
      </div>
    </div>
  );
};

export default ExpensePaymentSummary;
