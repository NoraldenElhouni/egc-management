import { useContractors } from "../../../hooks/useContractors";
import { ContractorsColumns } from "../../tables/columns/ContractorsColumns";
import GenericTable from "../../tables/table";

const ContractorsList = () => {
  const { contractors } = useContractors();
  return (
    <div>
      <GenericTable
        data={contractors}
        columns={ContractorsColumns}
        enableSorting
        enablePagination
        enableFiltering
        enableRowSelection
        showGlobalFilter
      />
    </div>
  );
};

export default ContractorsList;
