import { useVindors } from "../../../hooks/useVindors";
import { VindorsColumns } from "../../tables/columns/VindorsColumns";
import GenericTable from "../../tables/table";

const VindorsList = () => {
  const { vindors, loading, error } = useVindors();

  return (
    <div>
      <GenericTable
        data={vindors}
        columns={VindorsColumns}
        enableSorting
        enablePagination
        enableFiltering
        enableRowSelection
        showGlobalFilter
        onRowSelectionChange={(selected) =>
          console.log("Selected rows:", selected)
        }
      />
    </div>
  );
};

export default VindorsList;
