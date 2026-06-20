import React from "react";
import { Table } from "@tanstack/react-table";
import { Expense } from "../../../types/projects.type";
import {
  translateExpenseStatus,
  translateExpenseType,
  translatePhase,
} from "../../../utils/translations";

// ── Types matching your DB enums ──────────────────────────────────────────────
type ExpenseType = "labor" | "maps" | "material"; // adjust to your actual enum values
type PhaseType = "construction" | "finishing"; // adjust to your actual enum values
type ExpenseStatus = "pending" | "paid" | "partially_paid" | "deleted"; // adjust to your actual enum values

interface ExpenseTableFiltersProps {
  table: Table<Expense>;
  /** Called when any filter changes, useful if parent wants to know */
  onFilterChange?: () => void;
}

// Derive unique values from your translation utils so labels stay consistent
const EXPENSE_TYPES: ExpenseType[] = ["labor", "material", "maps"];
const PHASE_TYPES: PhaseType[] = ["construction", "finishing"];
const EXPENSE_STATUSES: ExpenseStatus[] = [
  "pending",
  "paid",
  "partially_paid",
  "deleted",
];

export default function ExpenseTableFilters({
  table,
  onFilterChange,
}: ExpenseTableFiltersProps) {
  // ── Local state for the date pickers (stored as strings, filtered as dates) ─
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [amountMin, setAmountMin] = React.useState("");
  const [amountMax, setAmountMax] = React.useState("");

  // ── Active badge count ────────────────────────────────────────────────────
  const activeCount =
    table.getState().columnFilters.length +
    (dateFrom || dateTo ? 1 : 0) +
    (amountMin || amountMax ? 1 : 0);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const setFilter = (columnId: string, value: unknown) => {
    table.getColumn(columnId)?.setFilterValue(value);
    onFilterChange?.();
  };

  const getFilterValue = (columnId: string) =>
    table.getColumn(columnId)?.getFilterValue();

  // Date range filter: we store a tuple [from, to] on the expense_date column
  const applyDateFilter = (from: string, to: string) => {
    if (!from && !to) {
      table.getColumn("expense_date")?.setFilterValue(undefined);
    } else {
      table.getColumn("expense_date")?.setFilterValue([from, to]);
    }
    onFilterChange?.();
  };

  const handleDateFrom = (v: string) => {
    setDateFrom(v);
    applyDateFilter(v, dateTo);
  };

  const handleDateTo = (v: string) => {
    setDateTo(v);
    applyDateFilter(dateFrom, v);
  };

  // Amount range filter: tuple [min, max] on total_amount column
  const applyAmountFilter = (min: string, max: string) => {
    if (!min && !max) {
      table.getColumn("total_amount")?.setFilterValue(undefined);
    } else {
      table
        .getColumn("total_amount")
        ?.setFilterValue([
          min ? Number(min) : undefined,
          max ? Number(max) : undefined,
        ]);
    }
    onFilterChange?.();
  };

  const handleAmountMin = (v: string) => {
    setAmountMin(v);
    applyAmountFilter(v, amountMax);
  };

  const handleAmountMax = (v: string) => {
    setAmountMax(v);
    applyAmountFilter(amountMin, v);
  };

  // Reset everything
  const resetAll = () => {
    table.resetColumnFilters();
    table.resetGlobalFilter();
    setDateFrom("");
    setDateTo("");
    setAmountMin("");
    setAmountMax("");
    onFilterChange?.();
  };

  // ── Select helper ─────────────────────────────────────────────────────────
  function FilterSelect<T extends string>({
    columnId,
    label,
    options,
    translateFn,
  }: {
    columnId: string;
    label: string;
    options: T[];
    translateFn: (v: T) => string;
  }) {
    const value = (getFilterValue(columnId) as T | undefined) ?? "";
    return (
      <div className="flex flex-col gap-1 min-w-[140px]">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </label>
        <select
          value={value}
          onChange={(e) =>
            setFilter(
              columnId,
              e.target.value === "" ? undefined : e.target.value,
            )
          }
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        >
          <option value="">الكل</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {translateFn(o)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      dir="rtl"
      className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-4"
    >
      {/* Row 1: Enum selects */}
      <div className="flex flex-wrap gap-4 items-end">
        <FilterSelect
          columnId="expense_type"
          label="نوع المصروف"
          options={EXPENSE_TYPES}
          translateFn={translateExpenseType}
        />
        <FilterSelect
          columnId="phase"
          label="المرحلة"
          options={PHASE_TYPES}
          translateFn={translatePhase}
        />
        <FilterSelect
          columnId="status"
          label="الحالة"
          options={EXPENSE_STATUSES}
          translateFn={(v) => translateExpenseStatus(v)}
        />

        {/* Date range */}
        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            التاريخ من
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => handleDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            التاريخ إلى
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => handleDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* Amount range */}
        <div className="flex flex-col gap-1 min-w-[130px]">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            المبلغ من
          </label>
          <input
            type="number"
            value={amountMin}
            min={0}
            placeholder="0"
            onChange={(e) => handleAmountMin(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
        <div className="flex flex-col gap-1 min-w-[130px]">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            المبلغ إلى
          </label>
          <input
            type="number"
            value={amountMax}
            min={0}
            placeholder="∞"
            onChange={(e) => handleAmountMax(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* Reset button */}
        {activeCount > 0 && (
          <div className="flex flex-col gap-1 justify-end">
            <label className="text-xs text-transparent select-none">.</label>
            <button
              onClick={resetAll}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition"
            >
              <span>مسح الفلاتر</span>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
                {activeCount}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
