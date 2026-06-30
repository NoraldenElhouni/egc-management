// pages/shop/vendors/ShopVendorsList.tsx
import { useMemo } from "react";
import { getShopVendorsColumns } from "../../../components/tables/columns/shops/vendors/ShopVendorsColumns";
import GenericTable from "../../../components/tables/table";
import ErrorPage from "../../../components/ui/errorPage";
import LoadingPage from "../../../components/ui/LoadingPage";
import { useVendors } from "../../../hooks/shop/vendors/useVendors";

const ShopVendorsList = () => {
  const { vendors, loading, error, toggleVendorShop } = useVendors();

  const columns = useMemo(
    () => getShopVendorsColumns(toggleVendorShop),
    [toggleVendorShop],
  );

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
        columns={columns}
        pageSize={10}
        enableSorting
        enablePagination
        enableFiltering
        enableRowSelection
        showGlobalFilter
      />
    </div>
  );
};

export default ShopVendorsList;
