import { ProjectRefund } from "../../../../types/global.type";
import { ProjectsRefundColumns } from "../../../tables/columns/ProjectRefundColumns";
import GenericTable from "../../../tables/table";
import ProjectRefundForm from "../../form/ProjectRefundForm";

interface BookRefundTabProps {
  refunds: ProjectRefund[];
  projectId: string;
}
const BookRefundTab = ({ refunds, projectId }: BookRefundTabProps) => {
  return (
    <div className="space-y-4">
      <div>
        <ProjectRefundForm projectId={projectId} />
      </div>
      <GenericTable
        enableFiltering
        enableSorting
        showGlobalFilter
        enablePagination
        initialSorting={[{ id: "serial_number", desc: true }]}
        data={refunds || []}
        columns={ProjectsRefundColumns}
      />
    </div>
  );
};

export default BookRefundTab;
