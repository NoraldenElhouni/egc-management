// BookProjectExpenseTab.tsx
import { ProjectWithDetailsForBook } from "../../../../types/projects.type";
import { ProjectsExpensesColumns } from "../../../tables/columns/ProjectExpenseColumns";
import GenericTable from "../../../tables/table";
import ProjectExpenseForm from "../../form/ProjectExpenseForm";
import { ProjectExpenseFormValues } from "../../../../types/schema/ProjectBook.schema";
import { PostgrestError } from "@supabase/supabase-js";
import { ProjectExpenses } from "../../../../types/global.type";

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
