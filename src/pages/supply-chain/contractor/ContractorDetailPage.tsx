import { useParams } from "react-router-dom";
import {
  useContractor,
  useContractorBids,
} from "../../../hooks/supply-chain/useContractor";
import LoadingPage from "../../../components/ui/LoadingPage";
import ErrorPage from "../../../components/ui/errorPage";
import GenericTable from "../../../components/tables/table";
import { BidsColumns } from "../../../components/tables/columns/contractors/BidsColumns";

const ContractorDetailPage = () => {
  const { contractorId } = useParams<{ contractorId: string }>();
  if (!contractorId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">No contractor id found</p>
      </div>
    );
  }
  const { contractor, error, loading } = useContractor(contractorId);
  const {
    bids,
    error: bidsError,
    loading: bidsLoading,
  } = useContractorBids(contractorId);

  if (loading || bidsLoading) {
    return <LoadingPage label="Loading contractor details..." />;
  }

  if (error || bidsError) {
    return (
      <ErrorPage
        label="حدث خطأ أثناء تحميل بيانات المقاول"
        error={error?.message || bidsError?.message}
      />
    );
  }

  if (!contractor) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">No contractor found</p>
      </div>
    );
  }

  return (
    <div>
      <div>
        {contractor.first_name} {contractor.last_name}
      </div>
      <div>
        <GenericTable
          data={bids ?? []}
          columns={BidsColumns}
          enableSorting
          enableFiltering
          showGlobalFilter
        />
      </div>
    </div>
  );
};

export default ContractorDetailPage;
