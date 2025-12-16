import { useTeam } from "../../../hooks/team/useTeam";
import { TeamEmployeesColumns } from "../../tables/columns/TeamEmployeesColumns";
import GenericTable from "../../tables/table";
import ErrorPage from "../../ui/errorPage";
import LoadingPage from "../../ui/LoadingPage";

interface TeamListProps {
  projectId: string;
}
const TeamList = ({ projectId }: TeamListProps) => {
  const { emplyees, loading, error } = useTeam(projectId);

  if (loading) return <LoadingPage label="تحميل الفريق..." />;

  if (error)
    return <ErrorPage error={error.message} label="خطأ في تحميل الفريق" />;

  return (
    <div>
      <GenericTable
        data={emplyees ?? []}
        columns={TeamEmployeesColumns}
        enableSorting
        enableFiltering
        showGlobalFilter
      />
    </div>
  );
};

export default TeamList;
