import { Routes, Route } from "react-router-dom";
import TasksPage from "../../pages/tasks/TasksPage";

// No RequirePermission here yet — permission keys for this module are
// Part 6 of the build plan (tasks/task-module-build-plan.md), deliberately
// skipped for now. Wire tasks.* keys into permission_catalog and gate this
// section the same way HR/Finance/etc. do before this ships for real.
export default function TasksRoutes() {
  return (
    <Routes>
      <Route index element={<TasksPage />} />
    </Routes>
  );
}
