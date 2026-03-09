import { useState } from "react";
import { DistributionPeriod } from "../../hooks/projects/useDistributionHistory";
import { formatCurrency } from "../../utils/helpper";

interface Props {
  period: DistributionPeriod;
  onConfirm: (note: string) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const ReverseDistributionDialog = ({
  period,
  onConfirm,
  onCancel,
  isSubmitting,
}: Props) => {
  const [note, setNote] = useState("");

  const currency = period.currency as "LYD" | "USD" | "EUR";

  const employeeItems = period.items.filter((i) => i.item_type === "employee");
  const bankItem = period.items.find((i) => i.item_type === "bank");
  const companyItem = period.items.find((i) => i.item_type === "company");

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-red-50 border-b border-red-200 px-5 py-4 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h2 className="text-base font-bold text-red-700">
              تأكيد عكس التوزيع
            </h2>
            <p className="text-xs text-red-500 mt-0.5">
              هذا الإجراء لا يمكن التراجع عنه — سيتم استرداد جميع الأرصدة
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Period summary */}
          <div className="rounded-lg border bg-gray-50 p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">المشروع</span>
              <span className="font-medium">{period.project.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">الفترة</span>
              <span className="font-medium tabular-nums">
                {period.start_date} → {period.end_date}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">الإجمالي</span>
              <span className="font-bold tabular-nums text-gray-800">
                {formatCurrency(period.total_amount, currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">العملة / النوع</span>
              <span className="font-medium">
                {currency} / {period.type === "cash" ? "نقد" : "بنك"}
              </span>
            </div>
          </div>

          {/* What will be reversed */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">
              الأرصدة التي سيتم استردادها:
            </p>
            <table className="w-full text-xs border rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr className="text-right text-gray-600">
                  <th className="px-3 py-1.5">الجهة</th>
                  <th className="px-3 py-1.5">نقد</th>
                  <th className="px-3 py-1.5">بنك</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {bankItem && (
                  <tr className="text-right bg-yellow-50">
                    <td className="px-3 py-1.5 font-medium">🏦 الاحتياطي</td>
                    <td className="px-3 py-1.5 tabular-nums text-red-600">
                      -{formatCurrency(bankItem.cash_amount, currency)}
                    </td>
                    <td className="px-3 py-1.5 tabular-nums text-red-600">
                      -{formatCurrency(bankItem.bank_amount, currency)}
                    </td>
                  </tr>
                )}
                {companyItem && (
                  <tr className="text-right bg-green-50">
                    <td className="px-3 py-1.5 font-medium">🏢 الشركة</td>
                    <td className="px-3 py-1.5 tabular-nums text-red-600">
                      -{formatCurrency(companyItem.cash_amount, currency)}
                    </td>
                    <td className="px-3 py-1.5 tabular-nums text-red-600">
                      -{formatCurrency(companyItem.bank_amount, currency)}
                    </td>
                  </tr>
                )}
                {employeeItems.map((emp) => (
                  <tr key={emp.id} className="text-right">
                    <td className="px-3 py-1.5">👤 {emp.employee_name}</td>
                    <td className="px-3 py-1.5 tabular-nums text-red-600">
                      -{formatCurrency(emp.cash_amount, currency)}
                    </td>
                    <td className="px-3 py-1.5 tabular-nums text-red-600">
                      -{formatCurrency(emp.bank_amount, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-400 mt-1.5">
              * سيتم حذف كشوف الرواتب المعلقة المرتبطة بهذا التوزيع
            </p>
          </div>

          {/* Reason input */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              سبب الإلغاء <span className="text-red-500">*</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="أدخل سبب عكس التوزيع..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-3 flex gap-2 justify-between bg-gray-50">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-md text-sm bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            onClick={() => onConfirm(note)}
            disabled={isSubmitting || note.trim().length < 3}
            className={[
              "px-4 py-2 rounded-md text-sm text-white font-medium",
              isSubmitting || note.trim().length < 3
                ? "bg-red-300 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700",
            ].join(" ")}
          >
            {isSubmitting ? "جاري الإلغاء..." : "تأكيد العكس"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReverseDistributionDialog;
