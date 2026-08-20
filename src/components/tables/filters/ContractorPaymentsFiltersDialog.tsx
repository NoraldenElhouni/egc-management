import { useState } from "react";
import { Table } from "@tanstack/react-table";
import { SlidersHorizontal } from "lucide-react";
import Dialog from "../../ui/Dialog";
import Button from "../../ui/Button";
import { translateStatus } from "../../../utils/translations";

interface ContractorPaymentsFiltersDialogProps {
  table: Table<any>;
  statusOptions: string[];
  projectOptions: string[];
  contractorOptions: string[];
  employeeOptions: string[];
}

/**
 * Filters button + dialog for the contractor payments / penalties tables.
 * Both share the same column ids (contractor, project, status, created_by,
 * created_at), so this one component drives either table.
 */
export default function ContractorPaymentsFiltersDialog({
  table,
  statusOptions,
  projectOptions,
  contractorOptions,
  employeeOptions,
}: ContractorPaymentsFiltersDialogProps) {
  const [open, setOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const activeCount =
    table.getState().columnFilters.length + (dateFrom || dateTo ? 1 : 0);

  const setFilter = (columnId: string, value: unknown) => {
    table.getColumn(columnId)?.setFilterValue(value || undefined);
  };

  const getFilterValue = (columnId: string) =>
    (table.getColumn(columnId)?.getFilterValue() as string | undefined) ?? "";

  const applyDateFilter = (from: string, to: string) => {
    table
      .getColumn("created_at")
      ?.setFilterValue(!from && !to ? undefined : [from, to]);
  };

  const handleDateFrom = (v: string) => {
    setDateFrom(v);
    applyDateFilter(v, dateTo);
  };

  const handleDateTo = (v: string) => {
    setDateTo(v);
    applyDateFilter(dateFrom, v);
  };

  const resetAll = () => {
    table.resetColumnFilters();
    setDateFrom("");
    setDateTo("");
  };

  const FilterSelect = ({
    columnId,
    label,
    options,
    translate,
  }: {
    columnId: string;
    label: string;
    options: string[];
    translate?: (v: string) => string;
  }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <select
        value={getFilterValue(columnId)}
        onChange={(e) => setFilter(columnId, e.target.value)}
        className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
      >
        <option value="">الكل</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {translate ? translate(o) : o}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative flex items-center gap-2 px-3 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <SlidersHorizontal className="w-4 h-4" />
        فلاتر
        {activeCount > 0 && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      <Dialog isOpen={open} onClose={() => setOpen(false)}>
        <div dir="rtl" className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">الفلاتر</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FilterSelect
              columnId="status"
              label="الحالة"
              options={statusOptions}
              translate={translateStatus}
            />
            <FilterSelect
              columnId="project"
              label="المشروع"
              options={projectOptions}
            />
            <FilterSelect
              columnId="contractor"
              label="المقاول"
              options={contractorOptions}
            />
            <FilterSelect
              columnId="created_by"
              label="أنشئ بواسطة"
              options={employeeOptions}
            />

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">
                التاريخ من
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => handleDateFrom(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">
                التاريخ إلى
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => handleDateTo(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={resetAll}
              disabled={activeCount === 0}
              className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              مسح الفلاتر
            </button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setOpen(false)}
            >
              تم
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
