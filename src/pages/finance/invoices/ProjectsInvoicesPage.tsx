import ProjectsList from "../../../components/project/lists/ProjectsList";

const InvoicesPage = () => {
  return (
    <div className="p-4">
      <ProjectsList basePath="/finance/invoices" />
    </div>
  );
};

export default InvoicesPage;
