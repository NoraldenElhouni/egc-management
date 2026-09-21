import Tooltip from "../../ui/Tooltip";

// "Where did this task come from" — the space and board it lives in.
//
// Only earns a column on the cross-board directory views
// (AssigneeViewPage, TaskTypeViewPage), where the grouping cuts across
// boards and a row otherwise gives you no clue about its origin.
// SpaceTasksPage already groups BY board inside one space, so the same
// column there would repeat its own group headings.
//
// Read-only: moving a task between boards is a different operation from
// editing a field, so there's no inline edit here.
//
// The board is the primary label and the space is the muted prefix,
// because within one of these lists the board is the more distinguishing
// of the two — several boards commonly share a space. Both truncate; the
// full "space › board" is on hover, since a 150px column will clip real
// Arabic board names often.
interface TaskSourceCellProps {
  spaceName?: string;
  boardName?: string;
}

export default function TaskSourceCell({ spaceName, boardName }: TaskSourceCellProps) {
  if (!spaceName && !boardName) return <div />;

  const full = [spaceName, boardName].filter(Boolean).join(" › ");

  return (
    <div className="min-w-0">
      <Tooltip label={full}>
        <span className="flex min-w-0 items-center gap-1 text-xs">
          {spaceName && <span className="truncate text-gray-400">{spaceName}</span>}
          {spaceName && boardName && <span className="shrink-0 text-gray-300">›</span>}
          {boardName && <span className="truncate text-gray-600">{boardName}</span>}
        </span>
      </Tooltip>
    </div>
  );
}
