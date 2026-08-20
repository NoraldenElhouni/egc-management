// pages/ContractDetailsPage.tsx
import React from "react";
import { Link, useParams } from "react-router-dom";
import Button from "../../../../../components/ui/Button";
import { FileText, Plus, Wallet } from "lucide-react";
import { StatusBadge } from "../../../../../components/ui/Badge";
import OverviewStatus from "../../../../../components/ui/OverviewStatus";
import { formatCurrency, formatDate } from "../../../../../utils/helpper";
import Separator from "../../../../../components/ui/separator";
import InfoRow from "../../../../../components/ui/InfoRow";
import GenericTable from "../../../../../components/tables/table";
import { MilestonesColumns } from "../../../../../components/tables/columns/operations/contracts/milestonesColumns";
import { PaymentRequestsColumns } from "../../../../../components/tables/columns/operations/contracts/paymentRequestsColumns";
import { contractItemsColumns } from "../../../../../components/tables/columns/operations/contracts/contractItemsColumns";
import LoadingPage from "../../../../../components/ui/LoadingPage";
import ErrorPage from "../../../../../components/ui/errorPage";
import {
  ContractDetail,
  useContractDetails,
} from "../../../../../hooks/operations/contracts/useContracts";

const contractStatusBadge = (status: ContractDetail["status"]) => {
  switch (status) {
    case "draft":
      return <StatusBadge.Pending label="مسودة" />;
    case "active":
      return <StatusBadge.Active />;
    case "completed":
      return <StatusBadge.Completed />;
    case "cancelled":
      return <StatusBadge.Cancelled />;
    default:
      return null;
  }
};

const ContractDetailsPage = () => {
  const { contractId } = useParams<{ contractId: string }>();

  const {
    contract,
    loading,
    error,
    totalPaid,
    totalRemaining,
    completedMilestones,
    daysRemaining,
  } = useContractDetails(contractId ?? "");

  if (!contractId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">No contract Id found</p>
      </div>
    );
  }

  if (loading) return <LoadingPage label="جاري تحميل تفاصيل العقد..." />;
  if (error)
    return (
      <ErrorPage label="حدث خطأ أثناء تحميل العقد" error={error.message} />
    );
  if (!contract) return null;

  const contractorName = contract.contractor
    ? `${contract.contractor.first_name} ${contract.contractor.last_name ?? ""}`
    : "—";
  const paidPercent =
    contract.total_amount > 0
      ? Math.round((totalPaid / contract.total_amount) * 100)
      : 0;

  const paymentsWithRequester = contract.request_payments.map((p) => ({
    ...p,
    requester: null,
  }));

  return (
    <div className="p-6 space-y-4">
      {/* header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">تفاصيل العقد</h1>
          <h4 className="text-sm text-gray-500 mt-1">
            {contract.round?.title ?? "—"} · {contract.project?.name ?? "—"}
          </h4>
        </div>
        <div className="flex items-center gap-3">
          <Link to={`../rounds/${contract.round_id}`} relative="path">
            <Button size="sm" variant="primary-outline">
              <FileText className="w-4 h-4 ml-2" />
              تفاصيل الجولة
            </Button>
          </Link>
          <Link to={"./milestones/new"}>
            <Button size="sm">
              <Plus className="w-4 h-4 ml-2" />
              إضافة مرحلة
            </Button>
          </Link>
          <Link to={"./payments/new"}>
            <Button size="sm">
              <Wallet className="w-4 h-4 ml-2" />
              طلب دفعة
            </Button>
          </Link>
        </div>
      </div>

      {/* overview bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 flex justify-between items-center">
        <div className="flex items-center flex-wrap gap-3">
          {contractStatusBadge(contract.status)}
          {contract.start_date && (
            <span className="text-sm text-gray-500">
              بدأ {formatDate(contract.start_date)}
            </span>
          )}
          {contract.end_date && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-sm text-gray-500">
                ينتهي {formatDate(contract.end_date)}
              </span>
            </>
          )}
          <span className="text-gray-300">·</span>
          <span className="text-sm text-gray-500">
            المقاول: {contractorName}
          </span>
        </div>
      </div>

      {/* stats */}
      <OverviewStatus
        stats={[
          {
            label: "إجمالي العقد",
            value: formatCurrency(contract.total_amount),
          },
          {
            label: "المدفوع",
            value: formatCurrency(totalPaid),
            secondaryLabel: "نسبة الإنجاز",
            secondaryValue: `${paidPercent}%`,
          },
          {
            label: "المتبقي",
            value: formatCurrency(totalRemaining),
          },
          {
            label: "المراحل",
            value: `${completedMilestones} / ${contract.milestones.length}`,
          },
          {
            label: "الأيام المتبقية",
            value: daysRemaining !== null ? String(daysRemaining) : "—",
          },
        ]}
      />

      {/* info cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* contractor */}
        <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col">
          <div className="flex gap-3 items-center mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
              {contract.contractor?.first_name.charAt(0) ?? "?"}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{contractorName}</h2>
              {contract.contractor && (
                <p className="text-xs text-gray-400">
                  {contract.contractor.id.slice(0, 8).toUpperCase()}
                </p>
              )}
            </div>
          </div>
          <Separator />
          <InfoRow
            label="رقم الهاتف"
            value={contract.contractor?.phone_number ?? "—"}
          />
          <InfoRow
            label="البريد الإلكتروني"
            value={contract.contractor?.email ?? "—"}
          />
          <InfoRow
            label="مدة التنفيذ"
            value={
              contract.duration_days ? `${contract.duration_days} يوم` : "—"
            }
            bordered={false}
          />
        </div>

        {/* contract summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col">
          <h2 className="font-semibold text-gray-900">تفاصيل العقد</h2>
          <Separator />
          <InfoRow label="المشروع" value={contract.project?.name ?? "—"} />
          <InfoRow
            label="التخصص"
            value={contract.round?.specialization?.name ?? "—"}
          />
          <InfoRow
            label="نسبة الدفعة المقدمة"
            value={`${contract.advance_percentage}%`}
          />
          <InfoRow
            label="نسبة التأمين"
            value={`${contract.insurance_percentage}%`}
          />
          <InfoRow
            label="غرامة التأخير اليومية"
            value={
              contract.delay_penalty_per_day !== null
                ? formatCurrency(contract.delay_penalty_per_day)
                : "—"
            }
          />
          <InfoRow
            label="تاريخ البداية"
            value={contract.start_date ? formatDate(contract.start_date) : "—"}
          />
          <InfoRow
            label="تاريخ الانتهاء"
            value={contract.end_date ? formatDate(contract.end_date) : "—"}
            bordered={false}
          />
        </div>
      </div>

      {/* terms */}
      {contract.terms && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-semibold text-gray-900">شروط العقد</h2>
          <Separator />
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {contract.terms}
          </p>
        </div>
      )}

      {/* contract items table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-900">بنود العقد</h2>
        </div>
        <Separator />
        <GenericTable
          data={contract.contract_items}
          columns={contractItemsColumns}
          enableSorting
        />
      </div>

      {/* milestones table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-900">المراحل</h2>

          <Link to={"./milestones/new"}>
            <Button size="sm">
              <Plus className="w-4 h-4 ml-2" />
              إضافة مرحلة
            </Button>
          </Link>
        </div>
        <Separator />
        <GenericTable
          data={contract.milestones}
          columns={MilestonesColumns}
          enableSorting
        />
      </div>

      {/* payment requests table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-900">سجل طلبات الدفع</h2>
          <Link to={"./payments/new"}>
            <Button size="sm">
              <Wallet className="w-4 h-4 ml-2" />
              طلب دفعة
            </Button>
          </Link>
        </div>
        <Separator />
        <GenericTable
          data={paymentsWithRequester}
          columns={PaymentRequestsColumns}
          enableSorting
        />
      </div>
    </div>
  );
};

export default ContractDetailsPage;
