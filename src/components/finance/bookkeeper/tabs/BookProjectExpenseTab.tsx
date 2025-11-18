import { ProjectWithDetailsForBook } from "../../../../types/projects.type";
import GenericTable from "../../../tables/table";

interface BookProjectExpenseTabProps {
  project: ProjectWithDetailsForBook | null;
}
const BookProjectExpenseTab = ({ project }: BookProjectExpenseTabProps) => {
  return (
    <div>
      <GenericTable
        data={project?.project_expenses || []}
        columns={[{ header: "المعرف", accessorKey: "id" }]}
      />
    </div>
  );
};

export default BookProjectExpenseTab;
