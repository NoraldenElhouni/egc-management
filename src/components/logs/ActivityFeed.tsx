import { useMemo } from "react";
import GenericTable from "../tables/table";
import Button from "../ui/Button";
import { useActivityLog } from "../../hooks/logs/useActivityLog";
import { getActivityLogColumns } from "../tables/columns/logs/ActivityLogColumns";
import { groupOperations, mergeBalanceRows } from "./groupEvents";
import type { ActivityFilters, ActivityRow } from "../../types/logs.types";

interface ActivityFeedProps {
  filters: ActivityFilters;
  onActorClick?: (actorId: string, actorName: string) => void;
  /** Shown at the end of the search row, e.g. a filters button + dialog. */
  searchAdornment?: React.ReactNode;
  emptyMessage?: string;
}

const subRowsOf = (row: ActivityRow) => row.related;
const rowIdOf = (row: ActivityRow) => `${row.log_name}-${row.id}`;

/**
 * A table of log events (public.get_activity), newest first, loading
 * older events on demand. Search bar above the table (same as every other
 * filterable table); the search covers the rows loaded so far, while the
 * filters passed in `filters` are applied by the database. The database
 * returns only the log groups the user may read.
 *
 * The events of one user action (an expense with its payment and balance
 * updates) show as one row that opens to list them (groupEvents.ts).
 */
const ActivityFeed = ({
  filters,
  onActorClick,
  searchAdornment,
  emptyMessage = "لا توجد أحداث مطابقة. يبدأ السجل من تاريخ تفعيله.",
}: ActivityFeedProps) => {
  const { data, isPending, isError, error, hasNextPage, fetchNextPage, isFetchingNextPage, isFetching } =
    useActivityLog(filters);

  const events = useMemo(() => data?.pages.flat() ?? [], [data]);
  const rows = useMemo(() => groupOperations(mergeBalanceRows(events)), [events]);
  const columns = useMemo(() => getActivityLogColumns(onActorClick), [onActorClick]);

  if (isError) {
    return <p className="text-sm text-red-600 p-4">تعذّر تحميل السجل: {(error as Error).message}</p>;
  }

  return (
    <div>
      <GenericTable<ActivityRow>
        data={rows}
        columns={columns}
        getSubRows={subRowsOf}
        getRowId={rowIdOf}
        enableFiltering
        showGlobalFilter
        enablePagination={false}
        searchAdornment={searchAdornment ? () => searchAdornment : undefined}
        emptyMessage={isPending ? "جاري تحميل السجل..." : emptyMessage}
      />
      <div className="flex items-center justify-between gap-2 mt-4">
        <span className="text-sm text-gray-500">
          {rows.length} عملية · {events.length} حدث
          {isFetching && !isFetchingNextPage ? " · جاري التحديث..." : ""}
        </span>
        {hasNextPage && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            تحميل المزيد
          </Button>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
