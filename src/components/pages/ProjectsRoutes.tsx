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
        <Route
          element={<RequirePermission permission="view_project_counters" />}
        >
          <Route path="counters" element={<ProjectsCountersPage />} />
          <Route path=":id/counters" element={<ProjectCountersPage />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default ProjectsRoutes;
