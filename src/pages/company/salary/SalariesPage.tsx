import { useState } from "react";
import GenericTable from "../../../components/tables/table";
import { PayrollColumns } from "../../../components/tables/columns/PayrollColumns";
import { usePayroll } from "../../../hooks/usePayroll";

const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const SalariesPage = () => {
  const [month, setMonth] = useState(getCurrentMonth());
  const { payroll, loading, error } = usePayroll();

  if (loading) return <div>جاري التحميل...</div>;
  if (error) return <div>حدث خطأ: {error.message}</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-semibold">SalariesPage</h1>

      <div className="max-w-xs">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Month
        </label>

        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>

      <div className="text-sm text-gray-600">Selected: {month}</div>
      <GenericTable
        data={payroll}
        columns={PayrollColumns}
        enableSorting
        enableFiltering
        enableRowSelection
        showGlobalFilter
        header={<h2 className="text-xl font-bold">رواتب الموظفين</h2>}
      />
    </div>
  );
};

export default SalariesPage;
