import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

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
    return (
      <div className="flex h-full items-center justify-center text-gray-300">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (boardId === null) {
    return <Navigate to="/tasks" replace />;
  }

  return <Navigate to={`/tasks/board/${boardId}/task/${taskId}`} replace />;
}
