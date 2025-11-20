import { ProjectWithDetailsForBook } from "../../../../types/projects.type";
import { ProjectsIncomeColumns } from "../../../tables/columns/ProjectIncomeColumns";
import GenericTable from "../../../tables/table";
import ProjectIncomeForm from "../../form/ProjectIncomeForm";

interface BookProjectIncomeTabProps {
  project: ProjectWithDetailsForBook | null;
}

const BookProjectIncomeTab = ({ project }: BookProjectIncomeTabProps) => {
  return (
    <div className="space-y-4">
      <div>
        <ProjectIncomeForm projectId={project?.id || ""} />
      </div>
      <GenericTable
        data={project?.project_incomes || []}
        columns={ProjectsIncomeColumns}
      />
    </div>
  );
};

export default BookProjectIncomeTab;
