import { useState } from "react";
import { ChevronDown } from "lucide-react";
import GenericTable from "../../tables/table";
import { formatCurrency } from "../../../utils/helpper";
import { undistributedExpensePaymentsColumns } from "../../tables/columns/finance/UndistributedExpensePaymentsColumns";
import { UndistributedExpensePaymentRow } from "../../../hooks/finance/distribution/useUndistributedExpensePayments";

function sumByCurrency(
  rows: UndistributedExpensePaymentRow[],
  field: "paymentAmount" | "percentageAmount",
): Record<string, number> {
  const totals: Record<string, number> = {};
  rows.forEach((r) => {
    const value = field === "paymentAmount" ? r.paymentAmount : r.percentageAmount;
    if (value == null) return;
    totals[r.currency] = (totals[r.currency] ?? 0) + value;
  });
  return totals;
}

function CurrencyAmounts({ totals }: { totals: Record<string, number> }) {
  const entries = Object.entries(totals);
  if (entries.length === 0) return <span className="text-gray-400">—</span>;
  return (
    <span className="whitespace-nowrap">
      {entries
        .map(([currency, amount]) => formatCurrency(amount, currency))
        .join(" + ")}
    </span>
  );
}

function hasNegative(totals: Record<string, number>): boolean {
  return Object.values(totals).some((amount) => amount < 0);
}

interface ProjectExpensePaymentsGroupProps {
  projectId: string;
  projectName: string;
  projectSerial: number | null;
  rows: UndistributedExpensePaymentRow[];
  defaultOpen?: boolean;
  selected?: boolean;
  onToggleSelect?: (projectId: string) => void;
}

const ProjectExpensePaymentsGroup = ({
  projectId,
  projectName,
  projectSerial,
  rows,
  defaultOpen = false,
  selected = false,
  onToggleSelect,
}: ProjectExpensePaymentsGroupProps) => {
  const [open, setOpen] = useState(defaultOpen);

  const paymentTotals = sumByCurrency(rows, "paymentAmount");
  const companyTotals = sumByCurrency(rows, "percentageAmount");
  const refundCount = rows.filter((r) => r.logType === "refund").length;

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
        {onToggleSelect && (
          <input
            type="checkbox"
            aria-label={`تحديد مشروع ${projectName} للطباعة`}
            checked={selected}
            onChange={() => onToggleSelect(projectId)}
            className="w-4 h-4 rounded border-gray-300 flex-shrink-0"
          />
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex-1 flex items-center justify-between gap-4 text-right min-w-0"
        >
          <div className="flex items-center gap-3 min-w-0">
            <ChevronDown
              className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${
                open ? "rotate-180" : ""
              }`}
            />
            <span className="font-semibold text-gray-900 truncate">
              {projectSerial != null ? `#${projectSerial} — ` : ""}
              {projectName}
            </span>
            <span className="flex-shrink-0 rounded-full bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5">
              {rows.length} دفعة
            </span>
            {refundCount > 0 && (
              <span className="flex-shrink-0 rounded-full bg-amber-50 text-amber-700 text-xs font-medium px-2 py-0.5">
                {refundCount} استرداد
              </span>
            )}
          </div>

          <div className="flex items-center gap-6 flex-shrink-0 text-sm">
            <div className="text-right">
              <div className="text-xs text-gray-400">إجمالي الدفعات</div>
              <CurrencyAmounts totals={paymentTotals} />
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">نصيب الشركة</div>
              <div
                className={`font-semibold ${
                  hasNegative(companyTotals) ? "text-red-600" : "text-blue-700"
                }`}
              >
                <CurrencyAmounts totals={companyTotals} />
              </div>
            </div>
          </div>
        </button>
      </div>

      {open && (
        <div className="border-t border-gray-100">
          <GenericTable
            data={rows}
            columns={undistributedExpensePaymentsColumns}
            enableSorting
            enablePagination
            emptyMessage="لا توجد دفعات لعرضها."
          />
        </div>
      )}
    </div>
  );
};

export default ProjectExpensePaymentsGroup;
