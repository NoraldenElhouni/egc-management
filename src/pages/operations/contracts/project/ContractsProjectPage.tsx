import { useParams } from "react-router-dom";
import { useContracts } from "../../../../hooks/operations/contracts/useContracts";
import { useRounds } from "../../../../hooks/operations/contracts/rounds/useRounds";
import LoadingPage from "../../../../components/ui/LoadingPage";
import ErrorPage from "../../../../components/ui/errorPage";
import GenericTable from "../../../../components/tables/table";
import { ContractsColumns } from "../../../../components/tables/columns/operations/contracts/ContractsColumns";
import { RoundsColumns } from "../../../../components/tables/columns/operations/contracts/RoundsColumns";
import Separator from "../../../../components/ui/separator";

const ContractsProjectPage = () => {
  const { projectId } = useParams<{ projectId: string }>();

  if (!projectId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">No project Id found</p>
      </div>
    );
  }

  const { contracts, error, loading } = useContracts(projectId);
  const {
    rounds,
    error: roundsError,
    loading: roundsLoading,
  } = useRounds(projectId);

  if (loading || roundsLoading) {
    return <LoadingPage label="Loading project details..." />;
  }
  if (error || roundsError) {
    return (
      <ErrorPage
        label="حدث خطأ أثناء تحميل بيانات المشروع"
        error={error?.message || roundsError?.message}
      />
    );
  }

  return (
    <div className="p-4">
      <GenericTable
        header="جميع العقود"
        data={contracts ?? []}
        columns={ContractsColumns}
        enableSorting
        enableFiltering
        showGlobalFilter
      />
      <Separator />
      <GenericTable
        header="جولات التسعير"
        linkLabel="+ جولة جديدة"
        link={`./rounds/new`}
        data={rounds ?? []}
        columns={RoundsColumns}
        enableSorting
        enableFiltering
        showGlobalFilter
      />
    </div>
  );
};

export default ContractsProjectPage;
