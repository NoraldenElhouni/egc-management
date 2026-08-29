import { useState } from "react";
import { Printer } from "lucide-react";
import {
  UndistributedExpensePaymentRow,
  useUndistributedExpensePayments,
} from "../../../../hooks/finance/distribution/useUndistributedExpensePayments";
import { fetchManagementApi } from "../../../../lib/managementApiClient";
import { undistributedExpensePaymentsColumns } from "../../../tables/columns/finance/UndistributedExpensePaymentsColumns";
import GenericTable from "../../../tables/table";
import Button from "../../../ui/Button";

interface ExpenseItem {
  serial_number: string;
  description: string;
  amount: number;
  date: string;
}

interface ExpensesReport {
  report_title: string;
  report_date: string;
  expenses: ExpenseItem[];
}

const BookProjectUndistributedExpenseTab = ({
  projectId,
}: {
  projectId: string;
}) => {
  const { rows, loading, error } = useUndistributedExpensePayments(projectId);
  const [printError, setPrintError] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  const handlePrint = async () => {
    const report: ExpensesReport = {
      report_title: "تقرير المصروفات غير الموزعة",
      report_date: new Date().toISOString().slice(0, 10),
      expenses: rows.map((row: UndistributedExpensePaymentRow) => ({
        serial_number:
          row.expenseSerial != null
            ? String(row.expenseSerial)
            : row.paymentSerial != null
              ? String(row.paymentSerial)
              : "",
        description: row.expenseDescription ?? "",
        amount: row.paymentAmount ?? 0,
        date: (row.paymentDate ?? row.expenseDate ?? row.createdAt).slice(
          0,
          10,
        ),
      })),
    };

    setPrinting(true);
    setPrintError(null);
    try {
      const response = await fetchManagementApi(
        "/api/v1/egc/management/expenses/pdf",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(report),
        },
      );

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      console.error("Error generating undistributed expenses PDF:", err);
      setPrintError(
        "فشل إنشاء التقرير: " +
          (err instanceof Error ? err.message : "خطأ غير معروف"),
      );
    } finally {
      setPrinting(false);
    }
  };

  if (loading) return <div className="p-4 text-gray-500">جاري التحميل...</div>;
  if (error)
    return (
      <div className="p-4 text-red-600">
        خطأ في تحميل المدفوعات: {error.message}
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          المصروفات التي تحتوي على مدفوعات ونسب غير موزعة
        </p>
        <Button
          type="button"
          variant="primary"
          size="sm"
          loading={printing}
          disabled={rows.length === 0 || printing}
          onClick={handlePrint}
        >
          <Printer className="h-4 w-4" />
          طباعة
        </Button>
      </div>
      {printError && <p className="text-sm text-red-600">{printError}</p>}
      <GenericTable<UndistributedExpensePaymentRow>
        data={rows}
        columns={undistributedExpensePaymentsColumns}
        enableFiltering
        showGlobalFilter
        enableSorting
        enablePagination
        emptyMessage="لا توجد مصروفات غير موزعة لعرضها."
      />
    </div>
  );
};

export default BookProjectUndistributedExpenseTab;
