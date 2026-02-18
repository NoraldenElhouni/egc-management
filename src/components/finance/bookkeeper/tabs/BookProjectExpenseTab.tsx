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
import { formatCurrency } from "../../../../utils/helpper";

interface BookProjectExpenseTabProps {
  project: ProjectWithDetailsForBook | null;
  addExpense: (data: ProjectExpenseFormValues) => Promise<{
    data: ProjectExpenses | null;
    error: PostgrestError | null;
  }>;
}

const BookProjectExpenseTab = ({
  project,
  addExpense,
}: BookProjectExpenseTabProps) => {
  //remove the deleted expenses from the list
  const fillterProject = project?.project_expenses.filter(
    (expense) => expense.deleted_at === null,
  );
  return (
    <div className="space-y-4">
      <Button variant="secondary">
        <Link to={`./bulk-expenses`}>إضافة مصروفات بالجملة</Link>
      </Button>
      <div>
        <OverviewStatus
          stats={[
            {
              label: "اجمالي النسبة",
              value: formatCurrency(
                project?.accounts
                  .filter((account) => account.currency === "LYD")
                  .reduce(
                    (acc, account) => acc + (account.total_percentage || 0),
                    0,
                  ) || 0,
              ),
              icon: Hash,
              iconBgColor: "bg-green-100",
              iconColor: "text-green-600",
            },
            {
              label: "اجمالي المصروفات",
              value: formatCurrency(
                project?.accounts
                  .filter((account) => account.currency === "LYD")
                  .reduce(
                    (acc, account) => acc + (account.total_expense || 0),
                    0,
                  ) || 0,
              ),
              icon: Hash,
              iconBgColor: "bg-green-100",
              iconColor: "text-green-600",
            },
            {
              label: "اجمالي الدخل",
              value: formatCurrency(
                project?.accounts
                  .filter((account) => account.currency === "LYD")
                  .reduce(
                    (acc, account) => acc + (account.total_transactions || 0),
                    0,
                  ) || 0,
              ),
              icon: Hash,
              iconBgColor: "bg-green-100",
              iconColor: "text-green-600",
            },
            {
              label: "الرصيد الحالي",
              value: formatCurrency(
                project?.accounts
                  .filter((account) => account.currency === "LYD")
                  .reduce((acc, account) => acc + (account.balance || 0), 0) ||
                  0,
              ),
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
          data={fillterProject || []}
          columns={ProjectsExpensesColumns}
        />
      </div>
    </div>
  );
};

export default BookProjectExpenseTab;
