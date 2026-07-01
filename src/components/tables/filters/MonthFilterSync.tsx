import { useMemo } from "react";
import { Table } from "@tanstack/react-table";
import { getMonthRange } from "../../../utils/date";

interface MonthFilterSyncProps<TData> {
  table: Table<TData>;
  month: string;
  columnId?: string;
}

/**
 * Headless helper that syncs an external `month` (YYYY-MM) value into a
 * TanStack Table column filter. Drop it inside GenericTable's `headerActions`.
 * Requires the target column to use `dateRangeFilter` as its `filterFn`.
 */
function MonthFilterSync<TData>({
  table,
  month,
  columnId = "pay_date",
}: MonthFilterSyncProps<TData>) {
  const { from, to } = getMonthRange(month);

  useMemo(() => {
    table.getColumn(columnId)?.setFilterValue(month ? [from, to] : undefined);
  }, [month, columnId]);

  return null;
}

export default MonthFilterSync;
