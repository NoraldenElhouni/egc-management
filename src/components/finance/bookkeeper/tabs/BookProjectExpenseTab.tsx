// BookProjectExpenseTab.tsx
import { ProjectWithDetailsForBook } from "../../../../types/projects.type";
import { ProjectsExpensesColumns } from "../../../tables/columns/ProjectExpenseColumns";
import GenericTable from "../../../tables/table";
import ProjectExpenseForm from "../../form/ProjectExpenseForm";
import { ProjectExpenseFormValues } from "../../../../types/schema/ProjectBook.schema";
import { PostgrestError } from "@supabase/supabase-js";
import { ProjectExpenses } from "../../../../types/global.type";
import OverviewStatus from "../../../ui/OverviewStatus";
import { Hash } from "lucide-react";
import Button from "../../../ui/Button";
import { Link } from "react-router-dom";

interface BookProjectExpenseTabProps {
  project: ProjectWithDetailsForBook | null;
  addExpense: (data: ProjectExpenseFormValues) => Promise<{
    data: ProjectExpenses | null; // ✅ Correct type
    error: PostgrestError | null;
  }>;
}

const BookProjectExpenseTab = ({
  project,
  addExpense,
}: BookProjectExpenseTabProps) => {
  return (
    <div className="space-y-4">
      <Button variant="secondary">
        <Link to={`./bulk-expenses`}>إضافة مصروفات بالجملة</Link>
      </Button>
      <div>
        <OverviewStatus
          stats={[
            {
              label: "اجمالي المصروفات",
              value:
                project?.project_expenses?.reduce(
                  (acc, expense) => acc + expense.total_amount,
                  0
                ) || 0,
              icon: Hash,
              iconBgColor: "bg-green-100",
              iconColor: "text-green-600",
            },
            {
              label: "إجمالي مصروفات المدفوعه",
              value:
                project?.project_expenses?.reduce(
                  (acc, expense) => acc + expense.amount_paid,
                  0
                ) || 0,
              icon: Hash,
              iconBgColor: "bg-green-100",
              iconColor: "text-green-600",
            },
            {
              label: "اجمالي المحجوز",
              value:
                project?.project_balances.reduce(
                  (acc, balance) => acc + balance.held,
                  0
                ) || 0,
              icon: Hash,
              iconBgColor: "bg-green-100",
              iconColor: "text-green-600",
            },

            {
              label: "اجمالي المتاح",
              value:
                project?.project_balances.reduce(
                  (acc, balance) => acc + balance.balance,
                  0
                ) || 0,
              icon: Hash,
              iconBgColor: "bg-green-100",
              iconColor: "text-green-600",
            },
          ]}
        />
      </div>
      <div>
        <ProjectExpenseForm
          projectId={project?.id || ""}
          addExpense={addExpense}
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

export default BookProjectExpenseTab;
