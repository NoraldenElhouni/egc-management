import { useMemo, useState } from "react";
import GenericTable from "../../../components/tables/table";
import LoadingPage from "../../../components/ui/LoadingPage";
import ErrorPage from "../../../components/ui/errorPage";
import Button from "../../../components/ui/Button";
import { useAuth } from "../../../hooks/useAuth";
import {
  useFinanceOrders,
  FinanceOrderRow,
} from "../../../hooks/finance/orders/useFinanceOrders";
import { getFinanceOrdersColumns } from "../../../components/tables/columns/finance/FinanceOrdersColumns";
import FinanceOrdersFiltersDialog from "../../../components/tables/filters/FinanceOrdersFiltersDialog";

function uniqueSorted(values: (string | undefined | null)[]): string[] {
  return Array.from(
    new Set(values.filter((v): v is string => Boolean(v))),
  ).sort((a, b) => a.localeCompare(b, "ar"));
}

const OrdersPage = () => {
  const { user } = useAuth();
  const { orders, loading, error, markOrdersEntered } = useFinanceOrders();
  const columns = useMemo(() => getFinanceOrdersColumns(), []);

  const [selectedOrders, setSelectedOrders] = useState<FinanceOrderRow[]>([]);
  const [clearSelectionSignal, setClearSelectionSignal] = useState(0);
  const [marking, setMarking] = useState(false);

  const filterOptions = useMemo(
    () => ({
      statuses: uniqueSorted(orders.map((o) => o.status)),
      projects: uniqueSorted(orders.map((o) => o.projects?.name)),
      vendors: uniqueSorted(orders.map((o) => o.vendors?.vendor_name)),
    }),
    [orders],
  );

  if (loading) return <LoadingPage />;
  if (error) return <ErrorPage error={error.message} />;

  async function handleMarkEntered() {
    const ids = selectedOrders
      .filter((o) => !o.finance_entered)
      .map((o) => o.id);
    if (ids.length === 0) return;

    setMarking(true);
    const { error: markError } = await markOrdersEntered(
      ids,
      user?.id ?? null,
    );
    setMarking(false);

    if (!markError) {
      setSelectedOrders([]);
      setClearSelectionSignal((n) => n + 1);
    }
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">طلبات الشراء</h1>
        <p className="text-sm text-gray-500 mt-1">
          حدد الطلبات التي تم إدخالها في النظام المالي ثم اضغط تحديد
        </p>
      </div>

      {selectedOrders.length > 0 && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5">
          <span className="text-sm font-medium text-blue-800">
            {selectedOrders.length} محدد
          </span>
          <Button
            type="button"
            variant="primary"
            size="sm"
            loading={marking}
            disabled={marking}
            onClick={handleMarkEntered}
          >
            تحديد كمُدخلة في النظام
          </Button>
        </div>
      )}

      <GenericTable
        data={orders}
        columns={columns}
        enableSorting
        enableFiltering
        enablePagination
        showGlobalFilter
        enableRowSelection
        onRowSelectionChange={setSelectedOrders}
        clearSelectionSignal={clearSelectionSignal}
        emptyMessage="لا توجد طلبات لعرضها."
        searchAdornment={(table) => (
          <FinanceOrdersFiltersDialog
            table={table}
            statusOptions={filterOptions.statuses}
            projectOptions={filterOptions.projects}
            vendorOptions={filterOptions.vendors}
          />
        )}
      />
    </div>
  );
};

export default OrdersPage;
