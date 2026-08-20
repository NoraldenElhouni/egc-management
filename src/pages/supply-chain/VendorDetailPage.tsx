import { useParams } from "react-router-dom";
import { useState } from "react";
import {
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  DollarSign,
  FolderKanban,
  Mail,
  MapPin,
  Phone,
  User,
  Wallet,
} from "lucide-react";

import { useVendor } from "../../hooks/supply-chain/vendors/useVendors";
import LoadingPage from "../../components/ui/LoadingPage";
import ErrorPage from "../../components/ui/errorPage";
import VendorContractorPdfButton from "../../components/pdf-buttons/VendorContractorPdfButton";
import EditVendorDialog from "../../components/supply-chain/vendor/EditVendorDialog";
import { ProjectExpenses } from "../../types/global.type";
import { formatCurrency, formatDate } from "../../utils/helpper";
import {
  translateExpenseStatus,
  translateExpenseType,
  translatePhase,
} from "../../utils/translations";

/* -------------------------------------------------------------------------- */
/*                           Expense sub-components                           */
/* -------------------------------------------------------------------------- */

const ExpenseRow = ({ expense }: { expense: ProjectExpenses }) => (
  <tr className="border-t border-gray-100 bg-gray-50 text-sm">
    <td className="px-4 py-2 text-gray-500">{expense.serial_number ?? "—"}</td>
    <td className="px-4 py-2">{expense.description ?? "—"}</td>
    <td className="px-4 py-2">{translateExpenseType(expense.expense_type)}</td>
    <td className="px-4 py-2">{translatePhase(expense.phase)}</td>
    <td className="px-4 py-2 text-red-600 font-medium">
      {formatCurrency(expense.total_amount, expense.currency)}
    </td>
    <td className="px-4 py-2 text-green-600">
      {formatCurrency(expense.amount_paid, expense.currency)}
    </td>
    <td className="px-4 py-2">
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          expense.status === "paid"
            ? "bg-green-100 text-green-700"
            : expense.status === "partially_paid"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700"
        }`}
      >
        {translateExpenseStatus(expense.status || "pending")}
      </span>
    </td>
  </tr>
);

const ProjectGroupRow = ({
  group,
}: {
  group: {
    projectId: string;
    projectName: string;
    projectSerialNumber: number | null;
    expenses: ProjectExpenses[];
  };
}) => {
  const [open, setOpen] = useState(false);

  const totalAmount = group.expenses.reduce(
    (sum, e) => sum + Number(e.total_amount),
    0,
  );
  const totalPaid = group.expenses.reduce(
    (sum, e) => sum + Number(e.amount_paid),
    0,
  );
  const currency = group.expenses[0]?.currency ?? "";

  return (
    <>
      <tr
        className="border-t border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <td className="px-4 py-3 font-medium text-gray-800">
          {group.projectSerialNumber ? `#${group.projectSerialNumber} ` : ""}
          {group.projectName}
        </td>
        <td className="px-4 py-3 text-center text-gray-500">
          {group.expenses.length}
        </td>
        <td className="px-4 py-3 text-red-600 font-semibold">
          {formatCurrency(totalAmount, currency)}
        </td>
        <td className="px-4 py-3 text-green-600 font-semibold">
          {formatCurrency(totalPaid, currency)}
        </td>
        <td className="px-4 py-3 text-orange-500 font-semibold">
          {formatCurrency(totalAmount - totalPaid, currency)}
        </td>
        <td className="px-4 py-3 text-center text-gray-400">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </td>
      </tr>

      {open && (
        <tr className="bg-gray-50">
          <td colSpan={6} className="px-4 pt-2 pb-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs border-b border-gray-200">
                  <th className="px-4 py-1 text-right font-medium">رقم</th>
                  <th className="px-4 py-1 text-right font-medium">الوصف</th>
                  <th className="px-4 py-1 text-right font-medium">النوع</th>
                  <th className="px-4 py-1 text-right font-medium">المرحلة</th>
                  <th className="px-4 py-1 text-right font-medium">الإجمالي</th>
                  <th className="px-4 py-1 text-right font-medium">المدفوع</th>
                  <th className="px-4 py-1 text-right font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {group.expenses.map((expense) => (
                  <ExpenseRow key={expense.id} expense={expense} />
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
};

/* -------------------------------------------------------------------------- */
/*                                 Main page                                  */
/* -------------------------------------------------------------------------- */

const VendorDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { vendor, groupedExpenses, loading, error, refetch } = useVendor(
    id || "",
  );

  if (!id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">لم يتم العثور على معرف المورد</p>
      </div>
    );
  }

  if (loading) return <LoadingPage label="جاري تحميل بيانات المورد..." />;

  if (error) {
    return (
      <ErrorPage label="حدث خطأ أثناء تحميل بيانات المورد" error={error.message} />
    );
  }

  if (!vendor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">لم يتم العثور على المورد</p>
      </div>
    );
  }

  const grandTotal = groupedExpenses.reduce(
    (sum, g) =>
      sum + g.expenses.reduce((s, e) => s + Number(e.total_amount), 0),
    0,
  );
  const grandPaid = groupedExpenses.reduce(
    (sum, g) => sum + g.expenses.reduce((s, e) => s + Number(e.amount_paid), 0),
    0,
  );
  const expenseCurrency = groupedExpenses[0]?.expenses[0]?.currency ?? "";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="rounded-3xl bg-white shadow-sm border border-gray-100 p-6">
          <div className="flex lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 rounded-2xl bg-blue-100 flex items-center justify-center">
                <Building2 className="h-10 w-10 text-blue-600" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {vendor.vendor_name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  {vendor.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{vendor.email}</span>
                    </div>
                  )}
                  {vendor.phone_number && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{vendor.phone_number}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>تاريخ الانضمام {formatDate(vendor.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowEditDialog(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                تعديل بيانات المورد
              </button>
              <VendorContractorPdfButton id={id} type="vendor" />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="عدد المشاريع"
            value={groupedExpenses.length}
            icon={<FolderKanban className="h-5 w-5" />}
          />
          <StatCard
            title="إجمالي المصروفات"
            value={formatCurrency(grandTotal, expenseCurrency)}
            icon={<DollarSign className="h-5 w-5" />}
          />
          <StatCard
            title="إجمالي المدفوع"
            value={formatCurrency(grandPaid, expenseCurrency)}
            icon={<Wallet className="h-5 w-5" />}
          />
          <StatCard
            title="المتبقي"
            value={formatCurrency(grandTotal - grandPaid, expenseCurrency)}
            icon={<DollarSign className="h-5 w-5" />}
          />
        </div>

        {/* Vendor Info + Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-3xl bg-white shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                معلومات المورد
              </h2>
            </div>
            <div className="space-y-5">
              <InfoItem label="اسم المورد" value={vendor.vendor_name} />
              <InfoItem
                label="الشخص المسؤول"
                value={vendor.contact_name || "غير متوفر"}
              />
              <InfoItem
                label="البريد الإلكتروني"
                value={vendor.email || "غير متوفر"}
              />
              <InfoItem
                label="رقم الهاتف"
                value={vendor.phone_number || "غير متوفر"}
              />
              <InfoItem
                label="رقم هاتف بديل"
                value={vendor.alt_phone_number || "غير متوفر"}
              />
              <InfoItem label="الدولة" value={vendor.country || "غير متوفر"} />
              <InfoItem label="المدينة" value={vendor.city || "غير متوفر"} />
              <InfoItem label="العنوان" value={vendor.address || "غير متوفر"} />
              <InfoItem
                label="تاريخ الإنشاء"
                value={formatDate(vendor.created_at)}
              />
            </div>
          </div>

          <div className="lg:col-span-2 rounded-3xl bg-white shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                ملخص الأداء
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <SummaryCard
                title="نسبة السداد"
                value={
                  grandTotal > 0
                    ? `${Math.round((grandPaid / grandTotal) * 100)}%`
                    : "0%"
                }
                description="نسبة المصروفات المدفوعة من إجمالي المصروفات"
              />
              <SummaryCard
                title="متوسط قيمة المصروف"
                value={
                  groupedExpenses.reduce((s, g) => s + g.expenses.length, 0) > 0
                    ? formatCurrency(
                        grandTotal /
                          groupedExpenses.reduce(
                            (s, g) => s + g.expenses.length,
                            0,
                          ),
                        expenseCurrency,
                      )
                    : formatCurrency(0, expenseCurrency)
                }
                description="متوسط قيمة كل مصروف"
              />
              <SummaryCard
                title="عدد المصروفات"
                value={`${groupedExpenses.reduce((s, g) => s + g.expenses.length, 0)} مصروف`}
                description="إجمالي عدد المصروفات المسجلة"
              />
              <SummaryCard
                title="حالة المورد"
                value="نشط"
                description="الحالة الحالية لحساب المورد"
              />
            </div>
          </div>
        </div>

        {/* Expenses grouped by project */}
        {groupedExpenses.length > 0 && (
          <div className="rounded-3xl bg-white shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  المصروفات حسب المشروع
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  جميع المصروفات المرتبطة بهذا المورد
                </p>
              </div>
              <div className="flex gap-6 text-sm">
                <span className="text-gray-500">
                  الإجمالي:{" "}
                  <span className="text-red-600 font-semibold">
                    {formatCurrency(grandTotal, expenseCurrency)}
                  </span>
                </span>
                <span className="text-gray-500">
                  المدفوع:{" "}
                  <span className="text-green-600 font-semibold">
                    {formatCurrency(grandPaid, expenseCurrency)}
                  </span>
                </span>
                <span className="text-gray-500">
                  المتبقي:{" "}
                  <span className="text-orange-500 font-semibold">
                    {formatCurrency(grandTotal - grandPaid, expenseCurrency)}
                  </span>
                </span>
              </div>
            </div>

            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="px-4 py-3 text-right font-medium">المشروع</th>
                  <th className="px-4 py-3 text-center font-medium">
                    عدد المصروفات
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    إجمالي المصروفات
                  </th>
                  <th className="px-4 py-3 text-right font-medium">المدفوع</th>
                  <th className="px-4 py-3 text-right font-medium">المتبقي</th>
                  <th className="px-4 py-3 text-center font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {groupedExpenses.map((group) => (
                  <ProjectGroupRow key={group.projectId} group={group} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EditVendorDialog
        open={showEditDialog}
        vendor={vendor}
        onClose={() => setShowEditDialog(false)}
        onSuccess={() => {
          setShowEditDialog(false);
          refetch();
        }}
      />
    </div>
  );
};

export default VendorDetailPage;

/* -------------------------------------------------------------------------- */
/*                                    UI                                      */
/* -------------------------------------------------------------------------- */

type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
};
const StatCard = ({ title, value, icon }: StatCardProps) => (
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

type InfoItemProps = { label: string; value: string };
const InfoItem = ({ label, value }: InfoItemProps) => (
  <div>
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className="text-sm font-medium text-gray-900 break-all">{value}</p>
  </div>
);

type SummaryCardProps = { title: string; value: string; description: string };
const SummaryCard = ({ title, value, description }: SummaryCardProps) => (
  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
    <p className="text-sm text-gray-500">{title}</p>
    <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
    <p className="text-sm text-gray-500 mt-2">{description}</p>
  </div>
);
