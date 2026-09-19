import { Routes, Route } from "react-router-dom";
import TasksLayout from "../sidebar/TasksLayout";
import TasksPage from "../../pages/tasks/TasksPage";
import TaskBoardPage from "../../pages/tasks/TaskBoardPage";
import DepartmentPage from "../../pages/tasks/DepartmentPage";
import MyWorkPage from "../../pages/tasks/MyWorkPage";
import AssigneeViewPage from "../../pages/tasks/AssigneeViewPage";
import TaskTypeViewPage from "../../pages/tasks/TaskTypeViewPage";
import ProjectViewPage from "../../pages/tasks/ProjectViewPage";
import TaskRedirect from "../../pages/tasks/TaskRedirect";
import TaskDetailPanel from "../tasks/detail/TaskDetailPanel";
import TemplatesAdminPage from "../../pages/tasks/admin/TemplatesAdminPage";
import TemplateBuilderPage from "../../pages/tasks/admin/TemplateBuilderPage";
import SpaceSettingsPage from "../../pages/tasks/admin/SpaceSettingsPage";
import FieldsAdminPage from "../../pages/tasks/admin/FieldsAdminPage";

// App.tsx gates the whole /tasks/* mount point behind one section-level
// permission (view_tasks_section, Admin only for now, while the module is
// in testing). Nothing inside this file is gated per-screen or per-action
// yet — that's Part 6 of the build plan (tasks/task-module-build-plan.md),
// deliberately on hold. Wire tasks.* keys into permission_catalog and gate
// individual routes/actions here the same way HR/Finance/etc. do before
// this ships to more than Admin.
//
// board/:id (D2), department/:id (D6), my-work (D7), by-assignee,
// by-type, and by-project each mount D3's slide-over as their own nested
// task/:id route. TaskDetailPanel reads no boardId param — it derives
// its "base path" from the current URL, so closing or following a
// breadcrumb/subtask link returns to whichever list opened it (previously
// every list navigated away to the task's board instead of staying put).
// by-assignee, by-type, and by-project are the company-wide "directory"
// views (useTaskDirectory.ts) — same nested-route pattern as
// department/my-work, but with full inline edit like the board table,
// not read-only rows. Separate from space/:id/settings (D9,
// which also holds D10's automations tab). admin/templates[/:id] (D8)
// and admin/fields (D11) are also real; task/:id without a list context
// (D1's search, etc.) goes through TaskRedirect so the panel is never
// opened without a list mounted behind it.
export default function TasksRoutes() {
  return (
    <Routes>
      <Route element={<TasksLayout />}>
        <Route index element={<TasksPage />} />
        <Route path="board/:boardId" element={<TaskBoardPage />}>
          <Route path="task/:taskId" element={<TaskDetailPanel />} />
        </Route>
        <Route path="department/:departmentId" element={<DepartmentPage />}>
          <Route path="task/:taskId" element={<TaskDetailPanel />} />
        </Route>
        <Route path="my-work" element={<MyWorkPage />}>
          <Route path="task/:taskId" element={<TaskDetailPanel />} />
        </Route>
        <Route path="by-assignee" element={<AssigneeViewPage />}>
          <Route path="task/:taskId" element={<TaskDetailPanel />} />
        </Route>
        <Route path="by-type" element={<TaskTypeViewPage />}>
          <Route path="task/:taskId" element={<TaskDetailPanel />} />
        </Route>
        <Route path="by-project" element={<ProjectViewPage />}>
          <Route path="task/:taskId" element={<TaskDetailPanel />} />
        </Route>
        <Route path="admin/templates" element={<TemplatesAdminPage />} />
        <Route path="admin/templates/:templateId" element={<TemplateBuilderPage />} />
        <Route path="admin/fields" element={<FieldsAdminPage />} />
        <Route path="space/:spaceId/settings" element={<SpaceSettingsPage />} />
        <Route path="task/:taskId" element={<TaskRedirect />} />
      </Route>
    </Routes>
  );
}
