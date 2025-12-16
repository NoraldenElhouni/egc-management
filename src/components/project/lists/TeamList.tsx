import { TeamEmployee } from "../../../types/team.type";
import { TeamEmployeesColumns } from "../../tables/columns/TeamEmployeesColumns";
import GenericTable from "../../tables/table";

interface TeamListProps {
  employees: TeamEmployee[] | null;
}

const TeamList = ({ employees }: TeamListProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        قائمة أعضاء الفريق
      </h3>

      {employees && employees.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          لا يوجد أعضاء في الفريق بعد. قم بإضافة أعضاء جدد أعلاه.
        </div>
      ) : (
        <GenericTable
          data={employees ?? []}
          columns={TeamEmployeesColumns}
          enableSorting
          enableFiltering
          showGlobalFilter
        />
      )}
    </div>
  );
};

export default TeamList;
