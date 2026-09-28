import { JobRequestsColumns } from "../../tables/columns/JobRequestsColumns";
import GenericTable from "../../tables/table";
import { useJobRequests } from "../../../hooks/hr/useJobRequests";

const JobRequestsList = () => {
  const { jobRequests, loading, error } = useJobRequests();

  if (loading) return <div>جاري التحميل...</div>;
  if (error) return <div>خطأ في تحميل طلبات التوظيف.</div>;

  return (
    <div>
      <GenericTable
        data={jobRequests}
        columns={JobRequestsColumns}
        enableSorting
        enablePagination
        enableFiltering
        showGlobalFilter
      />
    </div>
  );
};

export default JobRequestsList;
