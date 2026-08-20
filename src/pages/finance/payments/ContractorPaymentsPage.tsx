import { useState } from "react";
import Tabs from "../../../components/ui/Tabs";
import GenericTable from "../../../components/tables/table";
import ErrorPage from "../../../components/ui/errorPage";
import LoadingPage from "../../../components/ui/LoadingPage";
import Button from "../../../components/ui/Button";
import { useContractorPayments } from "../../../hooks/finance/payments/useContractorPayments";
import { useContractorPaymentsPdf } from "../../../hooks/finance/payments/useContractorPaymentsPdf";
import { getContractorPaymentsColumns } from "../../../components/tables/columns/ContractorPaymentsColumns";
import { getContractorPenaltiesColumns } from "../../../components/tables/columns/ContractorPaymentsPenaltiesColumns";
import {
  ContractPayment,
  ContractPaymentPenalty,
} from "../../../types/contracts.type";

const ContractorPaymentsPage = () => {
  const { payments, penalties, loading, error, refetch } =
    useContractorPayments();
  const {
    generate: generatePdf,
    loading: printing,
    error: printError,
  } = useContractorPaymentsPdf();

  const [selectedPayments, setSelectedPayments] = useState<ContractPayment[]>(
    [],
  );
  const [clearSelectionSignal, setClearSelectionSignal] = useState(0);

  if (loading) return <LoadingPage />;
  if (error) return <ErrorPage error={error.message} />;

  const pendingPaymentsCount = payments.filter(
    (p) => p.status === "pending",
  ).length;
  const pendingPenaltiesCount = penalties.filter(
    (p) => p.status === "pending",
  ).length;

  async function handlePrintSelected() {
    if (selectedPayments.length === 0) return;
    const success = await generatePdf(selectedPayments);
    if (success) {
      setSelectedPayments([]);
      setClearSelectionSignal((n) => n + 1);
    }
  }

  return (
    <div>
      <Tabs
        tabs={[
          {
            id: "payments",
            label: "الدفعات",
            badge: pendingPaymentsCount,
            content: (
              <>
                <div className="px-6 pt-6">
                  <h1 className="text-2xl font-semibold text-gray-900">
                    مدفوعات المقاولين
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    مراجعة دفعات وجزاءات المقاولين والموافقة عليها أو رفضها
                  </p>
                </div>

                {selectedPayments.length > 0 && (
                  <div className="mx-6 mt-4 flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5">
                    <span className="text-sm font-medium text-blue-800">
                      {selectedPayments.length} محدد
                    </span>
                    <div className="flex items-center gap-3">
                      {printError && (
                        <span className="text-sm text-red-600">
                          {printError}
                        </span>
                      )}
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        loading={printing}
                        disabled={printing}
                        onClick={handlePrintSelected}
                      >
                        طباعة
                      </Button>
                    </div>
                  </div>
                )}

                <GenericTable<ContractPayment>
                  data={payments}
                  columns={getContractorPaymentsColumns(refetch)}
                  enableSorting
                  enableFiltering
                  enablePagination
                  showGlobalFilter
                  enableRowSelection={true}
                  onRowSelectionChange={setSelectedPayments}
                  clearSelectionSignal={clearSelectionSignal}
                  emptyMessage="لا توجد دفعات لعرضها."
                />
              </>
            ),
          },
          {
            id: "penalties",
            label: "الجزاءات",
            badge: pendingPenaltiesCount,
            content: (
              <>
                <div className="px-6 pt-6">
                  <h1 className="text-2xl font-semibold text-gray-900">
                    مدفوعات المقاولين
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    مراجعة دفعات وجزاءات المقاولين والموافقة عليها أو رفضها
                  </p>
                </div>
                <GenericTable<ContractPaymentPenalty>
                  data={penalties}
                  columns={getContractorPenaltiesColumns(refetch)}
                  enableSorting
                  enableFiltering
                  enablePagination
                  showGlobalFilter
                  emptyMessage="لا توجد جزاءات لعرضها."
                />
              </>
            ),
          },
        ]}
      />
    </div>
  );
};

export default ContractorPaymentsPage;
