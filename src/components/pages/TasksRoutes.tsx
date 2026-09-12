import { Routes, Route } from "react-router-dom";
import TasksLayout from "../sidebar/TasksLayout";
import TasksPage from "../../pages/tasks/TasksPage";
import TaskBoardPage from "../../pages/tasks/TaskBoardPage";
import TaskRedirect from "../../pages/tasks/TaskRedirect";
import TaskDetailPanel from "../tasks/detail/TaskDetailPanel";

// No RequirePermission here yet — permission keys for this module are
// Part 6 of the build plan (tasks/task-module-build-plan.md), deliberately
// skipped for now. Wire tasks.* keys into permission_catalog and gate this
// section the same way HR/Finance/etc. do before this ships for real.
//
// department/:id and my-work are D1 sidebar destinations (D6/D7) that
// don't exist yet — they render the same placeholder as the section index
// so the sidebar has nowhere to send someone that 404s. board/:id (D2) and
// its nested task/:id (D3, the slide-over) are real now; task/:id without
// a board (D1's search, etc.) goes through TaskRedirect so the panel is
// never opened without the list mounted behind it.
export default function TasksRoutes() {
  return (
    <Routes>
      <Route element={<TasksLayout />}>
        <Route index element={<TasksPage />} />
        <Route path="board/:boardId" element={<TaskBoardPage />}>
          <Route path="task/:taskId" element={<TaskDetailPanel />} />
        </Route>
        <Route path="department/:departmentId" element={<TasksPage />} />
        <Route path="my-work" element={<TasksPage />} />
        <Route path="task/:taskId" element={<TaskRedirect />} />
      </Route>
    </Routes>
  );
}
