import { useMemo } from "react";
import GenericTable from "../tables/table";
import Button from "../ui/Button";
import { useActivityLog } from "../../hooks/logs/useActivityLog";
import { getActivityLogColumns } from "../tables/columns/logs/ActivityLogColumns";
import type { ActivityFilters, LogEvent } from "../../types/logs.types";

interface ActivityFeedProps {
  filters: ActivityFilters;
  onActorClick?: (actorId: string, actorName: string) => void;
  /** Shown at the end of the search row, e.g. a filters button + dialog. */
  searchAdornment?: React.ReactNode;
  emptyMessage?: string;
}

/**
 * A table of log events (public.get_activity), newest first, loading
 * older events on demand. Search bar above the table (same as every other
 * filterable table); the search covers the rows loaded so far, while the
 * filters passed in `filters` are applied by the database. The database
 * returns only the log groups the user may read.
 */
const ActivityFeed = ({
  filters,
  onActorClick,
  searchAdornment,
  emptyMessage = "لا توجد أحداث مطابقة. يبدأ السجل من تاريخ تفعيله.",
}: ActivityFeedProps) => {
  const { data, isPending, isError, error, hasNextPage, fetchNextPage, isFetchingNextPage, isFetching } =
    useActivityLog(filters);

  const rows = useMemo(() => data?.pages.flat() ?? [], [data]);
  const columns = useMemo(() => getActivityLogColumns(onActorClick), [onActorClick]);

  if (isError) {
    return <p className="text-sm text-red-600 p-4">تعذّر تحميل السجل: {(error as Error).message}</p>;
  }

  return (
    <div>
      <GenericTable<LogEvent>
        data={rows}
        columns={columns}
        enableFiltering
        showGlobalFilter
        enablePagination={false}
        searchAdornment={searchAdornment ? () => searchAdornment : undefined}
        emptyMessage={isPending ? "جاري تحميل السجل..." : emptyMessage}
      />
      <div className="flex items-center justify-between gap-2 mt-4">
        <span className="text-sm text-gray-500">
          {rows.length} حدث{isFetching && !isFetchingNextPage ? " · جاري التحديث..." : ""}
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
