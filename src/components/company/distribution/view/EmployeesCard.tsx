import { useNavigate } from "react-router-dom";
import { BatchDetailEmployee } from "../../../../hooks/company/useDistributionBatch";
import { formatCurrency } from "../../../../utils/helpper";
import { ArrowLeft } from "lucide-react";

const CURRENCIES = ["LYD", "USD", "EUR"];

interface EmployeesCardProps {
  employees: BatchDetailEmployee[];
  totalsByCurrency: Record<string, number>;
  date: string;
}

const getInitials = (firstName: string, lastName: string | null): string => {
  const first = firstName.trim()[0] ?? "";
  const last = lastName?.trim()[0] ?? "";
  return `${first}${last}`.toUpperCase();
};

const EmployeesCard = ({ employees, date }: EmployeesCardProps) => {
  const navigate = useNavigate();

  const totalAmount = employees.reduce((sum, emp) => {
    return (
      sum +
      CURRENCIES.reduce(
        (currencySum, c) => currencySum + (emp.totalsByCurrency[c] ?? 0),
        0,
      )
    );
  }, 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800">الموظفون</span>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">
            {employees.length}
          </span>
        </div>
        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">
          الإجمالي: {formatCurrency(totalAmount, "LYD")}
        </span>
      </div>

      {/* Rows */}
      {employees.map((emp) => (
        <button
          key={emp.employeeId}
          onClick={() =>
            navigate(
              `/company/distribute/employee/${emp.employeeId}?date=${date}`,
            )
          }
          className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors text-right group"
        >
          <div className="flex items-center gap-2.5">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 text-xs font-medium flex items-center justify-center shrink-0 select-none">
              {getInitials(emp.firstName, emp.lastName)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                {emp.firstName} {emp.lastName ?? ""}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {emp.specialization ?? "—"}
                {" · "}
                {emp.projectCount} مشاريع
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex flex-col items-end gap-0.5">
              {CURRENCIES.filter((c) => (emp.totalsByCurrency[c] ?? 0) > 0).map(
                (c) => (
                  <span
                    key={c}
                    className="text-xs text-gray-500 tabular-nums bg-gray-100 px-2 py-0.5 rounded"
                  >
                    {formatCurrency(emp.totalsByCurrency[c], c)}
                  </span>
                ),
              )}
            </div>
            <span className="text-gray-300 group-hover:text-blue-400 text-sm">
              <ArrowLeft size={16} />
            </span>
          </div>
        </button>
      ))}

      {employees.length === 0 && (
        <p className="text-center text-xs text-gray-400 py-8">لا يوجد موظفون</p>
      )}
    </div>
  );
};

export default EmployeesCard;
