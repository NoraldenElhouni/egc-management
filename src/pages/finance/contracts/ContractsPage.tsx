import { useMemo, useState } from "react";
import GenericTable from "../../../components/tables/table";
import LoadingPage from "../../../components/ui/LoadingPage";
import ErrorPage from "../../../components/ui/errorPage";
import Button from "../../../components/ui/Button";
import { useAuth } from "../../../hooks/useAuth";
import { useContractorPaymentsPdf } from "../../../hooks/finance/payments/useContractorPaymentsPdf";
import {
  useFinanceRequestPayments,
  FinanceRequestPayment,
  requestPaymentToPdfItem,
} from "../../../hooks/finance/contracts/useFinanceRequestPayments";
import { getFinanceRequestPaymentsColumns } from "../../../components/tables/columns/finance/FinanceRequestPaymentsColumns";
import FinanceRequestPaymentsFiltersDialog from "../../../components/tables/filters/FinanceRequestPaymentsFiltersDialog";

function uniqueSorted(values: (string | undefined | null)[]): string[] {
  return Array.from(
    new Set(values.filter((v): v is string => Boolean(v))),
  ).sort((a, b) => a.localeCompare(b, "ar"));
}

const ContractsPage = () => {
  const { user } = useAuth();
  const { payments, loading, error, markRequestPaymentsEntered } =
    useFinanceRequestPayments();
  const {
    generate: generatePdf,
    loading: printing,
    error: printError,
  } = useContractorPaymentsPdf();
  const columns = useMemo(() => getFinanceRequestPaymentsColumns(), []);

  const [selectedPayments, setSelectedPayments] = useState<
    FinanceRequestPayment[]
  >([]);
  const [clearSelectionSignal, setClearSelectionSignal] = useState(0);
  const [marking, setMarking] = useState(false);

  const filterOptions = useMemo(
    () => ({
      statuses: uniqueSorted(payments.map((p) => p.status)),
      projects: uniqueSorted(payments.map((p) => p.project?.name)),
      contractors: uniqueSorted(
        payments.map((p) =>
          p.contractor
            ? `${p.contractor.first_name} ${p.contractor.last_name ?? ""}`.trim()
            : undefined,
        ),
      ),
      requesters: uniqueSorted(
        payments.map((p) =>
          p.requester
            ? `${p.requester.first_name} ${p.requester.last_name ?? ""}`.trim()
            : undefined,
        ),
      ),
    }),
    [payments],
  );

  if (loading) return <LoadingPage />;
  if (error) return <ErrorPage error={error.message} />;

  async function handlePrintSelected() {
    if (selectedPayments.length === 0) return;
    const success = await generatePdf(
      selectedPayments.map(requestPaymentToPdfItem),
    );
    if (success) {
      setSelectedPayments([]);
      setClearSelectionSignal((n) => n + 1);
    }
  }

  async function handleMarkEntered() {
    const ids = selectedPayments
      .filter((p) => !p.finance_entered)
      .map((p) => p.id);
    if (ids.length === 0) return;

    setMarking(true);
    const { error: markError } = await markRequestPaymentsEntered(
      ids,
      user?.id ?? null,
    );
    setMarking(false);

    if (!markError) {
      setSelectedPayments([]);
      setClearSelectionSignal((n) => n + 1);
    }
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          طلبات دفع العقود
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          حدد طلبات الدفع لطباعتها أو لتحديدها كمُدخلة في النظام المالي
        </p>
      </div>

      {selectedPayments.length > 0 && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5">
          <span className="text-sm font-medium text-blue-800">
            {selectedPayments.length} محدد
          </span>
          <div className="flex items-center gap-3">
            {printError && (
              <span className="text-sm text-red-600">{printError}</span>
            )}
            <Button
              type="button"
              variant="primary-outline"
              size="sm"
              loading={printing}
              disabled={printing || marking}
              onClick={handlePrintSelected}
            >
              طباعة
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={marking}
              disabled={printing || marking}
              onClick={handleMarkEntered}
            >
              تحديد كمُدخلة في النظام
            </Button>
          </div>
        </div>
      )}

      <GenericTable
        data={payments}
        columns={columns}
        enableSorting
        enableFiltering
        enablePagination
        showGlobalFilter
        enableRowSelection
        onRowSelectionChange={setSelectedPayments}
        clearSelectionSignal={clearSelectionSignal}
        emptyMessage="لا توجد طلبات دفع لعرضها."
        searchAdornment={(table) => (
          <FinanceRequestPaymentsFiltersDialog
            table={table}
            statusOptions={filterOptions.statuses}
            projectOptions={filterOptions.projects}
            contractorOptions={filterOptions.contractors}
            requesterOptions={filterOptions.requesters}
          />
        )}
      />
    </div>
  );
};

export default ContractsPage;
