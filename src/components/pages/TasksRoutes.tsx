import { Routes, Route } from "react-router-dom";
import TasksLayout from "../sidebar/TasksLayout";
import TasksPage from "../../pages/tasks/TasksPage";
import TaskBoardPage from "../../pages/tasks/TaskBoardPage";
import DepartmentPage from "../../pages/tasks/DepartmentPage";
import MyWorkPage from "../../pages/tasks/MyWorkPage";
import TaskRedirect from "../../pages/tasks/TaskRedirect";
import TaskDetailPanel from "../tasks/detail/TaskDetailPanel";
import TemplatesAdminPage from "../../pages/tasks/admin/TemplatesAdminPage";
import TemplateBuilderPage from "../../pages/tasks/admin/TemplateBuilderPage";
import SpaceSettingsPage from "../../pages/tasks/admin/SpaceSettingsPage";
import FieldsAdminPage from "../../pages/tasks/admin/FieldsAdminPage";

// No RequirePermission here yet — permission keys for this module are
// Part 6 of the build plan (tasks/task-module-build-plan.md), deliberately
// skipped for now. Wire tasks.* keys into permission_catalog and gate this
// section the same way HR/Finance/etc. do before this ships for real.
//
// board/:id (D2) and its nested task/:id (D3, the slide-over),
// department/:id (D6), my-work (D7), admin/templates[/:id] (D8),
// space/:id/settings (D9, which also holds D10's automations tab), and
// admin/fields (D11) are all real now; task/:id without a board (D1's
// search, etc.) goes through TaskRedirect so the panel is never opened
// without the list mounted behind it.
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
        <Route path="admin/templates" element={<TemplatesAdminPage />} />
        <Route path="admin/templates/:templateId" element={<TemplateBuilderPage />} />
        <Route path="admin/fields" element={<FieldsAdminPage />} />
        <Route path="space/:spaceId/settings" element={<SpaceSettingsPage />} />
        <Route path="task/:taskId" element={<TaskRedirect />} />
      </Route>
    </Routes>
  );
}
