import { useVendors } from "../../../hooks/useVendors";
import { VendorsColumns } from "../../tables/columns/VindorsColumns";
import GenericTable from "../../tables/table";
import ErrorPage from "../../ui/errorPage";
import LoadingPage from "../../ui/LoadingPage";

const VendorsList = () => {
  const { vendors, loading, error } = useVendors();

  if (loading) {
    return <LoadingPage label="جاري تحميل الموردين..." />;
  }

  if (error) {
    return <ErrorPage error={error.message} label="خطأ في تحميل الموردين" />;
  }

  return (
    <div>
      <GenericTable
        data={vendors}
        columns={VendorsColumns}
        enableSorting
        enablePagination
        enableFiltering
        enableRowSelection
        showGlobalFilter
        // onRowSelectionChange={(selected) =>
        //   console.log("Selected rows:", selected)
        // }
      />
    </div>
  );
};

export default VendorsList;
