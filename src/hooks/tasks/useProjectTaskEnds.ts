import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";

// The day each project's task plan ends: the latest due date among its live
// tasks (not archived, not on an archived board, not template tasks) — what
// a space's Gantt shows as "النهاية المخططة". The tasks page's delivery
// timeline (TasksPage.tsx) places each project at this day.
//
// One query per project, newest due date first, limit 1: a single row each,
// so the server's row cap can never cut a result short. No staleTime, so
// opening the tasks page again picks up tasks moved since.
export function useProjectTaskEnds(projectIds: string[]) {
  const ids = Array.from(new Set(projectIds)).sort();
  const query = useQuery({
    queryKey: ["project-task-ends", ids],
    enabled: ids.length > 0,
    queryFn: async (): Promise<Map<string, string>> => {
      const tasksDb = supabase.schema("tasks");
      const rows = await Promise.all(
        ids.map(async (id) => {
          const { data, error } = await tasksDb
            .from("tasks")
            .select("due_date, boards!inner(is_archived)")
            .eq("project_id", id)
            .eq("is_archived", false)
            .eq("is_template", false)
            .eq("boards.is_archived", false)
            .not("due_date", "is", null)
            .order("due_date", { ascending: false })
            .limit(1);
          if (error) throw error;
          const due = data?.[0]?.due_date;
          return [id, due ? due.slice(0, 10) : null] as const;
        }),
      );
      const ends = new Map<string, string>();
      for (const [id, due] of rows) if (due) ends.set(id, due);
      return ends;
    },
  });
  return { taskEnds: query.data, loading: ids.length > 0 && query.isPending };
}
