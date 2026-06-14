import React from "react";
import { ProjectWithDetailsForBook } from "../../../../types/projects.type";
import GenericTable from "../../../tables/table";
import { ProjectsExpensesColumns } from "../../../tables/columns/ProjectExpenseColumns";
import OverviewStatus from "../../../ui/OverviewStatus";
import { formatCurrency } from "../../../../utils/helpper";

interface BookProjectExpenseNotPaidTabProps {
  project: ProjectWithDetailsForBook | null;
}
const BookProjectExpenseNotPaidTab = ({
  project,
}: BookProjectExpenseNotPaidTabProps) => {
  const filteredProject = project?.project_expenses.filter(
    (expense) =>
      expense.deleted_at === null &&
      Number(expense.amount_paid) < Number(expense.total_amount),
  );

  const lydBalances =
    project?.project_balances.filter((b) => b.currency === "LYD") ?? [];

  // balances
  const projectBalance = lydBalances.reduce(
    (acc, b) => acc + (b.balance || 0),
    0,
  );
  const accountBalance =
    project?.accounts
      .filter((a) => a.currency === "LYD")
      .reduce((acc, a) => acc + (a.balance || 0), 0) ?? 0;
  const balanceDiff = projectBalance - accountBalance;

  // income
  const totalIncome = lydBalances.reduce(
    (acc, b) => acc + (b.total_transactions || 0),
    0,
  );
  const lydIncomes =
    project?.project_incomes.filter((i) => i.currency === "LYD") ?? [];
  const cashIncome = lydIncomes
    .filter((i) => i.payment_method === "cash")
    .reduce((acc, i) => acc + (i.amount || 0), 0);
  const bankIncome = lydIncomes
    .filter((i) => i.payment_method === "bank")
    .reduce((acc, i) => acc + (i.amount || 0), 0);

  // expenses
  const balanceTotalExpense = lydBalances.reduce(
    (acc, b) => acc + (b.total_expense || 0),
    0,
  );
  const accountTotalExpenseCash =
    project?.accounts
      .filter((a) => a.currency === "LYD" && a.type === "cash")
      .reduce((acc, a) => acc + (a.total_expense || 0), 0) ?? 0;
  const accountTotalExpenseBank =
    project?.accounts
      .filter((a) => a.currency === "LYD" && a.type === "bank")
      .reduce((acc, a) => acc + (a.total_expense || 0), 0) ?? 0;

  const accountCashBalance =
    project?.accounts
      .filter((a) => a.currency === "LYD" && a.type === "cash")
      .reduce((acc, a) => acc + (a.balance || 0), 0) ?? 0;
  const accountBankBalance =
    project?.accounts
      .filter((a) => a.currency === "LYD" && a.type === "bank")
      .reduce((acc, a) => acc + (a.balance || 0), 0) ?? 0;

  return (
    <div className="space-y-4">
      <div>
        <OverviewStatus
          stats={[
            {
              label: "الرصيد",
              value: formatCurrency(projectBalance),
              // icon: Hash,
              // iconBgColor: "bg-blue-100",
              // iconColor: "text-blue-600",
              secondaryLabel: "رصيد الحالي",
              secondaryValue: formatCurrency(accountBalance),
              tertiaryLabel: "الفرق (غير مدفوع)",
              tertiaryValue: formatCurrency(balanceDiff),
            },
            {
              label: "اجمالي الدخل",
              value: formatCurrency(totalIncome),

              secondaryLabel: "نقدي",
              secondaryValue: formatCurrency(cashIncome),
              tertiaryLabel: "بنكي",
              tertiaryValue: formatCurrency(bankIncome),
            },
            {
              label: "اجمالي المصروفات",
              value: formatCurrency(balanceTotalExpense),

              secondaryLabel: "كاش",
              secondaryValue: formatCurrency(accountTotalExpenseCash),
              tertiaryLabel: "بنك",
              tertiaryValue: formatCurrency(accountTotalExpenseBank),
            },
            {
              label: "رصيد الحسابات",
              value: formatCurrency(accountBalance),

              secondaryLabel: "كاش",
              secondaryValue: formatCurrency(accountCashBalance),
              tertiaryLabel: "بنك",
              tertiaryValue: formatCurrency(accountBankBalance),
            },
          ]}
        />
      </div>
      <div>
        <GenericTable
          enableFiltering
          showGlobalFilter
          enableSorting
          enableRowSelection
          initialSorting={[{ id: "serial_number", desc: true }]}
          data={filteredProject || []}
          columns={ProjectsExpensesColumns}
        />
      </div>
    </div>
  );
};

export default BookProjectExpenseNotPaidTab;
