import { ProjectWithDetailsForBook } from "../../../../types/projects.type";
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
        columns={[{ header: "المعرف", accessorKey: "id" }]}
      />
    </div>
  );
};

export default BookProjectIncomeTab;
