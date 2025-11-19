import { ProjectWithDetailsForBook } from "../../../../types/projects.type";
import { ProjectsIncomeColumns } from "../../../tables/columns/ProjectIncomeColumns";
import GenericTable from "../../../tables/table";

interface BookProjectIncomeTabProps {
  project: ProjectWithDetailsForBook | null;
}

const BookProjectIncomeTab = ({ project }: BookProjectIncomeTabProps) => {
  return (
    <div>
      <div></div>
      <GenericTable
        data={project?.project_incomes || []}
        columns={ProjectsIncomeColumns}
      />
    </div>
  );
};

export default BookProjectIncomeTab;
