import { Routes, Route } from "react-router-dom";
import TasksLayout from "../sidebar/TasksLayout";
import TasksPage from "../../pages/tasks/TasksPage";
import TaskBoardPage from "../../pages/tasks/TaskBoardPage";
import DepartmentPage from "../../pages/tasks/DepartmentPage";
import MyWorkPage from "../../pages/tasks/MyWorkPage";
import TaskRedirect from "../../pages/tasks/TaskRedirect";
import TaskDetailPanel from "../tasks/detail/TaskDetailPanel";

// No RequirePermission here yet — permission keys for this module are
// Part 6 of the build plan (tasks/task-module-build-plan.md), deliberately
// skipped for now. Wire tasks.* keys into permission_catalog and gate this
// section the same way HR/Finance/etc. do before this ships for real.
//
// board/:id (D2) and its nested task/:id (D3, the slide-over),
// department/:id (D6), and my-work (D7) are all real now; task/:id
// without a board (D1's search, etc.) goes through TaskRedirect so the
// panel is never opened without the list mounted behind it.
export default function TasksRoutes() {
  return (
    <Routes>
      <Route element={<TasksLayout />}>
        <Route index element={<TasksPage />} />
        <Route path="board/:boardId" element={<TaskBoardPage />}>
          <Route path="task/:taskId" element={<TaskDetailPanel />} />
        </Route>
        <Route path="department/:departmentId" element={<DepartmentPage />} />
        <Route path="my-work" element={<MyWorkPage />} />
        <Route path="task/:taskId" element={<TaskRedirect />} />
      </Route>
    </Routes>
  );
}
