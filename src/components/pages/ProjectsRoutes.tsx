import { Route, Routes } from "react-router-dom";
import RequirePermission from "../auth/RequirePermission";
import ProjectsLayout from "../sidebar/ProjectsLayout";
import ProjectsPage from "../../pages/projects/Projects";
import NewProjectPage from "../../pages/projects/NewProject";
import ProjectDetailsPage from "../../pages/projects/ProjectDetailsPage";
import ProjectsCountersPage from "../../pages/projects/ProjectsCountersPage";
import ProjectCountersPage from "../../pages/projects/ProjectCountersPage";

const ProjectsRoutes = () => {
  return (
    <Routes>
      <Route element={<ProjectsLayout />}>
        <Route element={<RequirePermission permission="view_projects" />}>
          <Route index element={<ProjectsPage />} />
          <Route path=":id" element={<ProjectDetailsPage />} />
        </Route>
        <Route element={<RequirePermission permission="create_project" />}>
          <Route path="new" element={<NewProjectPage />} />
        </Route>
        {/* All-projects counters summary. Gated on view_all_project_counters,
            which is company-wide on purpose: view_project_counters is
            is_project_scoped = true and the resolver force-denies a
            project-scoped permission asked without a project (DECISION 3),
            so it cannot gate a page summarizing every project at once.
            view_all_project_counters does not exist in permission_catalog
            yet — see permissions/new-permissions-todo.md — so this route
            denies everyone until that row is added in Supabase. */}
        <Route
          element={
            <RequirePermission permission="view_all_project_counters" />
          }
        >
          <Route path="counters" element={<ProjectsCountersPage />} />
        </Route>
        <Route
          element={<RequirePermission permission="view_project_counters" />}
        >
          <Route path=":projectId/counters" element={<ProjectCountersPage />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default ProjectsRoutes;
