// pages/shop/vendors/ShopVendorsList.tsx
import { useEffect, useMemo } from "react";
import { getShopVendorsColumns } from "../../../components/tables/columns/shops/vendors/ShopVendorsColumns";
import GenericTable from "../../../components/tables/table";
import ErrorPage from "../../../components/ui/errorPage";
import LoadingPage from "../../../components/ui/LoadingPage";
import { useVendors } from "../../../hooks/shop/vendors/useVendors";

const ShopVendorsList = () => {
  const {
    vendors,
    loading,
    error,
    actionError,
    clearActionError,
    toggleVendorShop,
    updateVendorLimitFlow,
  } = useVendors();

  const columns = useMemo(
    () => getShopVendorsColumns(toggleVendorShop, updateVendorLimitFlow),
    [toggleVendorShop, updateVendorLimitFlow],
  );

  useEffect(() => {
    if (!actionError) return;
    const t = setTimeout(clearActionError, 3500);
    return () => clearTimeout(t);
  }, [actionError, clearActionError]);

  if (loading) {
    return <LoadingPage label="جاري تحميل الموردين..." />;
  }

  if (error) {
    return <ErrorPage error={error.message} label="خطأ في تحميل الموردين" />;
  }

  return (
    <div className="relative">
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

      {actionError && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[9999] w-[92%] max-w-sm -translate-x-1/2
                     rounded-lg border border-amber-200 bg-amber-50 px-4 py-3
                     text-sm text-amber-800 shadow-md"
        >
          {actionError.message}
        </div>
      )}
    </div>
  );
};

export default ShopVendorsList;
