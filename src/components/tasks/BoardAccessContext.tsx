import { createContext, useContext } from "react";
import { NO_CAPS, taskRowCaps, type TaskCaps } from "../../hooks/tasks/useTaskAccess";

// What the signed-in user may do on the board being shown: the space's caps,
// what being assigned adds, and who "me" is. TaskBoardPage provides it once;
// TaskTable / TaskRow read it instead of threading three more props through a
// recursive row. Defaults to nothing allowed, so a row rendered outside a
// provider is read-only rather than editable by accident.

export interface BoardAccess {
  spaceCaps: TaskCaps;
  assigneeCaps: TaskCaps;
  myUserId: string | null;
}

const BoardAccessContext = createContext<BoardAccess>({
  spaceCaps: NO_CAPS,
  assigneeCaps: NO_CAPS,
  myUserId: null,
});

export const BoardAccessProvider = BoardAccessContext.Provider;

export function useBoardAccess(): BoardAccess {
  return useContext(BoardAccessContext);
}

/** Capabilities on one task of this board: space caps, plus assignee caps if it is mine. */
export function useRowCaps(assigneeIds: string[]): TaskCaps {
  const { spaceCaps, assigneeCaps, myUserId } = useContext(BoardAccessContext);
  return taskRowCaps(spaceCaps, assigneeCaps, !!myUserId && assigneeIds.includes(myUserId));
}
