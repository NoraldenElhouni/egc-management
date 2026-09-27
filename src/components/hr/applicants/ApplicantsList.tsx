import { ApplicantsColumns } from "../../tables/columns/ApplicantsColumns";
import GenericTable from "../../tables/table";
import { useApplicants } from "../../../hooks/hr/useApplicants";

const ApplicantsList = () => {
  const { applicants, loading, error } = useApplicants();

  if (loading) return <div>جاري التحميل...</div>;
  if (error) return <div>خطأ في تحميل بيانات المتقدمين.</div>;

  return (
    <div>
      <GenericTable
        data={applicants}
        columns={ApplicantsColumns}
        enableSorting
        enablePagination
        enableFiltering
        showGlobalFilter
      />
    </div>
  );
};

export default ApplicantsList;
