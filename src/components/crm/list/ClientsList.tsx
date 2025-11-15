import { useClients } from "../../../hooks/useClients";
import { ClientsColumns } from "../../tables/columns/ClientsColumns";
import GenericTable from "../../tables/table";

const ClientsList = () => {
  const { clients } = useClients();
  return (
    <div>
      <GenericTable
        data={clients}
        columns={ClientsColumns}
        enableSorting
        enablePagination
        enableFiltering
        enableRowSelection
        showGlobalFilter
      />
    </div>
  );
};

export default ClientsList;
