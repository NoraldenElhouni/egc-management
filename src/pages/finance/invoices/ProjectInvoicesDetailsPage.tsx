import { useParams } from "react-router-dom";
import { InvoicesColumns } from "../../../components/tables/columns/InvoicesColumns";
import GenericTable from "../../../components/tables/table";
import { useInvoices } from "../../../hooks/finance/useInvoices";

const ProjectInvoicesDetailsPage = () => {
  const { projectId } = useParams<{ projectId: string }>();

  if (!projectId) {
    return <div className="p-4">Project ID is missing</div>;
  }

  const { invoices } = useInvoices(projectId);
  return (
    <div className="p-4">
      <GenericTable
        columns={InvoicesColumns}
        data={invoices}
        enableFiltering
        enableRowSelection
        enableSorting
        showGlobalFilter
        initialSorting={[{ id: "invoice_no", desc: true }]}
      />
    </div>
  );
};

export default ProjectInvoicesDetailsPage;
