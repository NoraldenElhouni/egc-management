import { ProjectWithDetailsForBook } from "../../../../types/projects.type";
import { ProjectsExpensesColumns } from "../../../tables/columns/ProjectExpenseColumns";
import GenericTable from "../../../tables/table";

interface BookProjectExpenseTabProps {
  project: ProjectWithDetailsForBook | null;
}
const BookProjectExpenseTab = ({ project }: BookProjectExpenseTabProps) => {
  return (
    <div>
      <GenericTable
        data={project?.project_expenses || []}
        columns={ProjectsExpensesColumns}
      />
    </div>
  );
};

export default BookProjectExpenseTab;
