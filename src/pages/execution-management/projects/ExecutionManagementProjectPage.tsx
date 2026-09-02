import { ProjectExecutionColumns } from "../../../components/tables/columns/Execution/projects/ProjectExecutionColumns";
import GenericTable from "../../../components/tables/table";
import ErrorPage from "../../../components/ui/errorPage";
import LoadingPage from "../../../components/ui/LoadingPage";
import { useProjects } from "../../../hooks/execution-management/project/useProjects";

const ExecutionManagementProjectPage = () => {
  const { data: projects, isLoading, error } = useProjects();

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error) {
    return <ErrorPage error={error.message} />;
  }

  return (
    <div className="bg-background p-6 text-foreground">
      <GenericTable
        columns={ProjectExecutionColumns}
        data={projects ?? []}
        header="إدارة المشاريع"
        initialSorting={[{ id: "serial_number", desc: true }]}
      />
    </div>
  );
};

export default ExecutionManagementProjectPage;
