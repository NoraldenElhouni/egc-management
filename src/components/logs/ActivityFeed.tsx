import ActivityTable from "./ActivityTable";
import { useActivityLog } from "../../hooks/logs/useActivityLog";
import type { ActivityFilters } from "../../types/logs.types";

interface ActivityFeedProps {
  filters: ActivityFilters;
  onActorClick?: (actorId: string, actorName: string) => void;
  /** Shown at the end of the search row, e.g. a filters button + dialog. */
  searchAdornment?: React.ReactNode;
  emptyMessage?: string;
}

/**
 * The logs tables' events (public.get_activity) in an ActivityTable. The
 * database returns only the log groups the user may read.
 */
const ActivityFeed = ({ filters, ...tableProps }: ActivityFeedProps) => {
  const query = useActivityLog(filters);
  return <ActivityTable query={query} {...tableProps} />;
};

export default ActivityFeed;
