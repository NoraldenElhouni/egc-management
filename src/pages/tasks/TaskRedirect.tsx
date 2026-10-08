import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { TaskListPageSkeleton } from "../../components/tasks/TasksSkeletons";

// Standalone /tasks/task/:taskId (from D1's search, or a future
// notification/My-work deep link) has no board in the URL — the detail
// panel is only ever mounted nested under a board (see TasksRoutes.tsx),
// so this looks up the task's board and hands off to the real route,
// keeping "list stays visible behind the panel" true everywhere it opens
// from, not just the board screen itself.
export default function TaskRedirect() {
  const { taskId } = useParams<{ taskId: string }>();
  const [boardId, setBoardId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (!taskId) return;
    supabase
      .schema("tasks")
      .from("tasks")
      .select("board_id")
      .eq("id", taskId)
      .maybeSingle()
      .then(({ data }) => setBoardId(data?.board_id ?? null));
  }, [taskId]);

  if (boardId === undefined) {
    return <TaskListPageSkeleton />;
  }

  if (boardId === null) {
    return <Navigate to="/tasks" replace />;
  }

  return <Navigate to={`/tasks/board/${boardId}/task/${taskId}`} replace />;
}
