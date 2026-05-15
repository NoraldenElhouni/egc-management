import { useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Phone,
  Mail,
  User,
  Gavel,
} from "lucide-react";

import {
  useContractor,
  useContractorBids,
} from "../../../hooks/supply-chain/useContractor";

import LoadingPage from "../../../components/ui/LoadingPage";
import ErrorPage from "../../../components/ui/errorPage";
import GenericTable from "../../../components/tables/table";

import { BidsColumns } from "../../../components/tables/columns/contractors/BidsColumns";
import { formatCurrency, formatDate } from "../../../utils/helpper";

const ContractorDetailPage = () => {
  const { contractorId } = useParams<{ contractorId: string }>();

  const { contractor, loading, error } = useContractor(contractorId || "");

  const {
    bids,
    loading: bidsLoading,
    error: bidsError,
  } = useContractorBids(contractorId || "");

  const stats = useMemo(() => {
    const totalBids = bids?.length || 0;

    const acceptedBids =
      bids?.filter((bid) => bid.status === "accepted").length || 0;

    const pendingBids =
      bids?.filter((bid) => bid.status === "pending").length || 0;

    const rejectedBids =
      bids?.filter((bid) => bid.status === "rejected").length || 0;

    const totalValue =
      bids?.reduce((acc, bid) => acc + Number(bid.total_price || 0), 0) || 0;

    return {
      totalBids,
      acceptedBids,
      pendingBids,
      rejectedBids,
      totalValue,
    };
  }, [bids]);

  if (!contractorId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">لم يتم العثور على معرف المقاول</p>
      </div>
    );
  }

  if (loading || bidsLoading) {
    return <LoadingPage label="جاري تحميل بيانات المقاول..." />;
  }

  if (error || bidsError) {
    return (
      <ErrorPage
        label="حدث خطأ أثناء تحميل بيانات المقاول"
        error={error?.message || bidsError?.message}
      />
    );
  }

  if (!contractor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">لم يتم العثور على المقاول</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="rounded-3xl bg-white shadow-sm border border-gray-100 p-6">
          <div className="flex lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 rounded-2xl bg-blue-100 flex items-center justify-center">
                <User className="h-10 w-10 text-blue-600" />
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {contractor.first_name} {contractor.last_name}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  {contractor.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{contractor.email}</span>
                    </div>
                  )}

                  {contractor.phone_number && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{contractor.phone_number}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      تاريخ الانضمام {formatDate(contractor.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition">
                تعديل بيانات المقاول
              </button>

              <button className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 transition">
                عرض العقود
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <StatCard
            title="إجمالي العطاءات"
            value={stats.totalBids}
            icon={<Gavel className="h-5 w-5" />}
          />

          <StatCard
            title="العطاءات المقبولة"
            value={stats.acceptedBids}
            icon={<CheckCircle2 className="h-5 w-5" />}
          />

          <StatCard
            title="العطاءات المعلقة"
            value={stats.pendingBids}
            icon={<Clock className="h-5 w-5" />}
          />

          <StatCard
            title="العطاءات المرفوضة"
            value={stats.rejectedBids}
            icon={<FileText className="h-5 w-5" />}
          />

          <StatCard
            title="إجمالي القيمة"
            value={formatCurrency(stats.totalValue)}
            icon={<DollarSign className="h-5 w-5" />}
          />
        </div>

        {/* Contractor Info + Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contractor Information */}
          <div className="rounded-3xl bg-white shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Briefcase className="h-5 w-5 text-blue-600" />

              <h2 className="text-lg font-semibold text-gray-900">
                معلومات المقاول
              </h2>
            </div>

            <div className="space-y-5">
              <InfoItem
                label="الاسم الكامل"
                value={`${contractor.first_name} ${contractor.last_name || ""}`}
              />

              <InfoItem
                label="البريد الإلكتروني"
                value={contractor.email || "غير متوفر"}
              />

              <InfoItem
                label="رقم الهاتف"
                value={contractor.phone_number || "غير متوفر"}
              />

              <InfoItem label="معرف المقاول" value={contractor.id} />

              <InfoItem
                label="تاريخ الإنشاء"
                value={formatDate(contractor.created_at)}
              />
            </div>
          </div>

          {/* Performance Summary */}
          <div className="lg:col-span-2 rounded-3xl bg-white shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle2 className="h-5 w-5 text-green-600" />

              <h2 className="text-lg font-semibold text-gray-900">
                ملخص الأداء
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <SummaryCard
                title="نسبة نجاح العطاءات"
                value={
                  stats.totalBids > 0
                    ? `${Math.round(
                        (stats.acceptedBids / stats.totalBids) * 100,
                      )}%`
                    : "0%"
                }
                description="نسبة العطاءات المقبولة من إجمالي العطاءات"
              />

              <SummaryCard
                title="متوسط قيمة العطاء"
                value={
                  stats.totalBids > 0
                    ? formatCurrency(stats.totalValue / stats.totalBids)
                    : "$0"
                }
                description="متوسط قيمة كل عطاء مقدم"
              />

              <SummaryCard
                title="العطاءات الحالية"
                value={`${stats.pendingBids} مفتوح`}
                description="عدد العطاءات قيد الانتظار"
              />

              <SummaryCard
                title="حالة المقاول"
                value="نشط"
                description="الحالة الحالية لحساب المقاول"
              />
            </div>
          </div>
        </div>

        {/* Bids Table */}
        <div className="rounded-3xl bg-white shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                العطاءات المقدمة
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                جميع العطاءات المقدمة من المقاول
              </p>
            </div>
          </div>

          <GenericTable
            data={bids ?? []}
            columns={BidsColumns}
            enableSorting
            enableFiltering
            showGlobalFilter
            pageSize={5}
            initialSorting={[{ id: "submitted_at", desc: true }]}
          />
        </div>
      </div>
    </div>
  );
};

export default ContractorDetailPage;

/* -------------------------------------------------------------------------- */
/*                                    UI                                      */
/* -------------------------------------------------------------------------- */

type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
};

const StatCard = ({ title, value, icon }: StatCardProps) => {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-gray-500">{icon}</div>
      </div>

      <div>
        <p className="text-sm text-gray-500">{title}</p>

        <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
      </div>
    </div>
  );
};

type InfoItemProps = {
  label: string;
  value: string;
};

const InfoItem = ({ label, value }: InfoItemProps) => {
  return (
    <div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>

      <p className="text-sm font-medium text-gray-900 break-all">{value}</p>
    </div>
  );
};

type SummaryCardProps = {
  title: string;
  value: string;
  description: string;
};

const SummaryCard = ({ title, value, description }: SummaryCardProps) => {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
      <p className="text-sm text-gray-500">{title}</p>

      <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>

      <p className="text-sm text-gray-500 mt-2">{description}</p>
    </div>
  );
};
