import { useClients } from "../../../hooks/useClients";
import { ClientsColumns } from "../../tables/columns/ClientsColumns";
import GenericTable from "../../tables/table";

const ClientsList = () => {
  const { clients, loading, error } = useClients();

  if (loading) {
    return <div>Loading clients...</div>;
  }
  if (error) {
    return <div>Error loading clients: {error.message}</div>;
  }
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
