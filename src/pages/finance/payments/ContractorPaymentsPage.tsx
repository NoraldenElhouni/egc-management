import Tabs from "../../../components/ui/Tabs";
import GenericTable from "../../../components/tables/table";
import ErrorPage from "../../../components/ui/errorPage";
import LoadingPage from "../../../components/ui/LoadingPage";
import { useContractorPayments } from "../../../hooks/finance/payments/useContractorPayments";
import { getContractorPaymentsColumns } from "../../../components/tables/columns/ContractorPaymentsColumns";
import { getContractorPenaltiesColumns } from "../../../components/tables/columns/ContractorPaymentsPenaltiesColumns";
import {
  ContractPayment,
  ContractPaymentPenalty,
} from "../../../types/contracts.type";

const ContractorPaymentsPage = () => {
  const { payments, penalties, loading, error, refetch } =
    useContractorPayments();

  if (loading) return <LoadingPage />;
  if (error) return <ErrorPage error={error.message} />;

  return (
    <div>
      <Tabs
        tabs={[
          {
            id: "payments",
            label: "الدفعات",
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
                <GenericTable<ContractPayment>
                  data={payments}
                  columns={getContractorPaymentsColumns(refetch)}
                  enableSorting
                  enableFiltering
                  enablePagination
                  showGlobalFilter
                  emptyMessage="لا توجد دفعات لعرضها."
                />
              </>
            ),
          },
          {
            id: "penalties",
            label: "الجزاءات",
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
