import { useParams } from "react-router-dom";
import VendorContractorPdfButton from "../../components/pdf-buttons/VendorContractorPdfButton";
import { useState } from "react";
import { useVendor } from "../../hooks/supply-chain/vendors/useVendors";
import LoadingPage from "../../components/ui/LoadingPage";
import ErrorPage from "../../components/ui/errorPage";
import VendorInfoView from "../../components/supply-chain/VendorInfoView";
import VendorInfoEdit, {
  VendorFormValues,
} from "../../components/supply-chain/VendorInfoEdit";
import { supabase } from "../../lib/supabaseClient";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ProjectExpenses } from "../../types/global.type";
import { formatCurrency } from "../../utils/helpper";
import {
  translateExpenseStatus,
  translateExpenseType,
  translatePhase,
} from "../../utils/translations";

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
        <>
          <tr className="bg-gray-50">
            <td colSpan={6} className="px-4 pt-2 pb-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs border-b border-gray-200">
                    <th className="px-4 py-1 text-right font-medium">رقم</th>
                    <th className="px-4 py-1 text-right font-medium">الوصف</th>
                    <th className="px-4 py-1 text-right font-medium">النوع</th>
                    <th className="px-4 py-1 text-right font-medium">
                      المرحلة
                    </th>
                    <th className="px-4 py-1 text-right font-medium">
                      الإجمالي
                    </th>
                    <th className="px-4 py-1 text-right font-medium">
                      المدفوع
                    </th>
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
        </>
      )}
    </>
  );
};

const VendorDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (values: VendorFormValues) => {
    if (!id) return;
    setSaving(true);

    const { error } = await supabase
      .from("vendors")
      .update({
        vendor_name: values.vendor_name,
        contact_name: values.contact_name || null,
        email: values.email || null,
        phone_number: values.phone_number || null,
        alt_phone_number: values.alt_phone_number || null,
        country: values.country || null,
        city: values.city || null,
        address: values.address || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    setSaving(false);

    if (error) {
      alert("حدث خطأ أثناء حفظ بيانات المورد");
      return;
    }

    alert("تم تحديث بيانات المورد بنجاح");
    setEdit(false);
    window.location.reload();
  };

  if (!id) return null;

  const { error, loading, vendor, groupedExpenses } = useVendor(id);

  if (loading) return <LoadingPage />;
  if (error || !vendor) return <ErrorPage error={error?.message} />;

  const grandTotal = groupedExpenses.reduce(
    (sum, g) =>
      sum + g.expenses.reduce((s, e) => s + Number(e.total_amount), 0),
    0,
  );
  const grandPaid = groupedExpenses.reduce(
    (sum, g) => sum + g.expenses.reduce((s, e) => s + Number(e.amount_paid), 0),
    0,
  );
  const currency = groupedExpenses[0]?.expenses[0]?.currency ?? "";

  return (
    <div dir="rtl" className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">تفاصيل المورد</h1>
        <VendorContractorPdfButton id={id} type="vendor" />
      </div>

      {edit ? (
        <VendorInfoEdit
          vendor={vendor}
          saving={saving}
          onCancel={() => setEdit(false)}
          onSave={handleSave}
        />
      ) : (
        <VendorInfoView vendor={vendor} onEdit={() => setEdit(true)} />
      )}

      {groupedExpenses.length > 0 && (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">
              المصروفات حسب المشروع
            </h2>
            <div className="flex gap-6 text-sm">
              <span className="text-gray-500">
                الإجمالي:{" "}
                <span className="text-red-600 font-semibold">
                  {formatCurrency(grandTotal, currency)}
                </span>
              </span>
              <span className="text-gray-500">
                المدفوع:{" "}
                <span className="text-green-600 font-semibold">
                  {formatCurrency(grandPaid, currency)}
                </span>
              </span>
              <span className="text-gray-500">
                المتبقي:{" "}
                <span className="text-orange-500 font-semibold">
                  {formatCurrency(grandTotal - grandPaid, currency)}
                </span>
              </span>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-white text-gray-500 text-xs">
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
  );
};

export default VendorDetailPage;
