import React, { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "../../../../../../components/ui/Button";
import { Plus } from "lucide-react";
import OverviewStatus from "../../../../../../components/ui/OverviewStatus";
import GenericTable from "../../../../../../components/tables/table";
import LoadingPage from "../../../../../../components/ui/LoadingPage";
import ErrorPage from "../../../../../../components/ui/errorPage";
import { formatCurrency } from "../../../../../../utils/helpper";
import { PaymentRequestsColumns } from "../../../../../../components/tables/columns/operations/contracts/paymentRequestsColumns";
import { useContractPaymentLog } from "../../../../../../hooks/operations/contracts/usePayments";
import { useContractDetails } from "../../../../../../hooks/operations/contracts/useContracts";

const ContractPaymentLogPage = () => {
  const { contractId } = useParams<{ contractId: string }>();

  const { payments, loading, error } = useContractPaymentLog(
    contractId ?? "",
  );
  const { contract, loading: contractLoading } = useContractDetails(
    contractId ?? "",
  );

  const stats = useMemo(() => {
    const totalRequested = payments.reduce(
      (sum, p) => sum + (p.grand_total ?? p.amount),
      0,
    );
    const totalPaid = payments
      .filter((p) => p.status === "approved" || p.status === "paid")
      .reduce((sum, p) => sum + (p.grand_total ?? p.amount), 0);
    const pendingCount = payments.filter((p) => p.status === "pending").length;
    return { totalRequested, totalPaid, pendingCount };
  }, [payments]);

  if (!contractId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">No contract Id found</p>
      </div>
    );
  }

  if (loading || contractLoading)
    return <LoadingPage label="جاري تحميل سجل الدفعات..." />;
  if (error)
    return (
      <ErrorPage label="حدث خطأ أثناء تحميل السجل" error={error.message} />
    );

  return (
    <div className="p-6 space-y-4">
      {/* header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">سجل طلبات الدفع</h1>
          <h4 className="text-sm text-gray-500 mt-1">
            {contract?.round?.title ?? "—"} · {contract?.project?.name ?? "—"}
          </h4>
        </div>
        <div className="flex items-center gap-3">
          <Link to=".." relative="path">
            <Button size="sm" variant="primary-outline">
              تفاصيل العقد
            </Button>
          </Link>
          <Link to="./new">
            <Button size="sm">
              <Plus className="w-4 h-4 ml-2" />
              طلب دفعة
            </Button>
          </Link>
        </div>
      </div>

      {/* stats */}
      <OverviewStatus
        stats={[
          {
            label: "إجمالي المطلوب",
            value: formatCurrency(stats.totalRequested),
          },
          {
            label: "إجمالي المدفوع",
            value: formatCurrency(stats.totalPaid),
          },
          {
            label: "طلبات معلّقة",
            value: stats.pendingCount,
          },
          {
            label: "عدد الطلبات",
            value: payments.length,
          },
        ]}
      />

      {/* payments table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <GenericTable
          data={payments}
          columns={PaymentRequestsColumns}
          enableSorting
          enableFiltering
          showGlobalFilter
        />
      </div>
    </div>
  );
};

export default ContractPaymentLogPage;
