// BookProjectExpensePercentageTab.tsx
import { ProjectWithDetailsForBook } from "../../../../types/projects.type";
import { ProjectsExpensesColumns } from "../../../tables/columns/ProjectExpenseColumns";
import GenericTable from "../../../tables/table";
import { ProjectExpensePercentageFormValues } from "../../../../types/schema/ProjectBook.schema";
import { PostgrestError } from "@supabase/supabase-js";
import { ProjectExpenses } from "../../../../types/global.type";
import OverviewStatus from "../../../ui/OverviewStatus";
import { Hash } from "lucide-react";
import { formatCurrency } from "../../../../utils/helpper";
import ProjectExpensePercentageForm from "../../form/ProjectExpensePercentageForm";

interface BookProjectExpensePercentageTabProps {
  project: ProjectWithDetailsForBook | null;
  addExpensePercentage: (data: ProjectExpensePercentageFormValues) => Promise<{
    data: ProjectExpenses | null; // ✅ Correct type
    error: PostgrestError | null;
  }>;
}

const BookProjectExpensePercentageTab = ({
  project,
  addExpensePercentage,
}: BookProjectExpensePercentageTabProps) => {
  return (
    <div className="space-y-4">
      <div>
        <OverviewStatus
          stats={[
            {
              label: "اجمالي المصروفات",
              value: formatCurrency(
                project?.project_expenses
                  ?.filter((expense) => expense.status !== "deleted")
                  .reduce((acc, expense) => acc + expense.total_amount, 0) || 0,
              ),
              icon: Hash,
              iconBgColor: "bg-green-100",
              iconColor: "text-green-600",
            },
            {
              label: "إجمالي مصروفات المدفوعه",
              value: formatCurrency(
                project?.project_expenses
                  ?.filter((expense) => expense.status !== "deleted")
                  .reduce((acc, expense) => acc + expense.amount_paid, 0) || 0,
              ),
              icon: Hash,
              iconBgColor: "bg-green-100",
              iconColor: "text-green-600",
            },
            {
              label: "اجمالي المحجوز",
              value: formatCurrency(
                project?.project_balances.reduce(
                  (acc, balance) => acc + balance.held,
                  0,
                ) || 0,
              ),
              icon: Hash,
              iconBgColor: "bg-green-100",
              iconColor: "text-green-600",
            },

            {
              label: "اجمالي المتاح",
              value: formatCurrency(
                project?.project_balances.reduce(
                  (acc, balance) => acc + balance.balance,
                  0,
                ) || 0,
              ),
              icon: Hash,
              iconBgColor: "bg-green-100",
              iconColor: "text-green-600",
            },
          ]}
        />
      </div>
      <div>
        <ProjectExpensePercentageForm
          projectId={project?.id || ""}
          addExpensePercentage={addExpensePercentage}
        />
      </div>

      <div>
        <GenericTable
          enableFiltering
          showGlobalFilter
          enableSorting
          enableRowSelection
          initialSorting={[{ id: "serial_number", desc: true }]}
          data={project?.project_expenses || []}
          columns={ProjectsExpensesColumns}
        />
      </div>
    </div>
  );
};

export default BookProjectExpensePercentageTab;
