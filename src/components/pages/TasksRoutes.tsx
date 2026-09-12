import { Routes, Route } from "react-router-dom";
import TasksLayout from "../sidebar/TasksLayout";
import TasksPage from "../../pages/tasks/TasksPage";

// No RequirePermission here yet — permission keys for this module are
// Part 6 of the build plan (tasks/task-module-build-plan.md), deliberately
// skipped for now. Wire tasks.* keys into permission_catalog and gate this
// section the same way HR/Finance/etc. do before this ships for real.
//
// board/:id, department/:id, my-work and task/:id are D1 sidebar
// destinations (D2/D6/D7/D3) that don't exist yet — they render the same
// placeholder as the section index so the sidebar has nowhere to send
// someone that 404s. Swap each one in as its real screen gets built.
export default function TasksRoutes() {
  return (
    <Routes>
      <Route element={<TasksLayout />}>
        <Route index element={<TasksPage />} />
        <Route path="board/:boardId" element={<TasksPage />} />
        <Route path="department/:departmentId" element={<TasksPage />} />
        <Route path="my-work" element={<TasksPage />} />
        <Route path="task/:taskId" element={<TasksPage />} />
      </Route>
    </Routes>
  );
}
