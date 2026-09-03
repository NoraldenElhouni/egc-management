import { Route, Routes } from "react-router-dom";
import RequirePermission from "../auth/RequirePermission";
import ProjectsLayout from "../sidebar/ProjectsLayout";
import ProjectsPage from "../../pages/projects/Projects";
import NewProjectPage from "../../pages/projects/NewProject";
import ProjectTeamPage from "../../pages/projects/team/ProjectTeamPage";
import ProjectTeamDetailsPage from "../../pages/projects/team/id/ProjectTeamDetailsPage";
import TeamPermissions from "../../pages/projects/team/id/permissions/TeamPermissions";
// Phase 6 — the new Project -> Permissions page (guide 4.6). Purely
// additive: the TeamPermissions route above is untouched and still runs
// on the old project_user_permissions table until its 184 rows are
// migrated with your sign-off.
import ProjectPermissionsPage from "../../pages/projects/team/id/ProjectPermissionsPage";
import ProjectDetailsPage from "../../pages/projects/ProjectDetailsPage";
import ProjectsCountersPage from "../../pages/projects/ProjectsCountersPage";
import ProjectCountersPage from "../../pages/projects/ProjectCountersPage";

const ProjectsRoutes = () => {
  return (
    <Routes>
      <Route element={<RequirePermission permission="view_projects" />}>
        <Route element={<ProjectsLayout />}>
          <Route index element={<ProjectsPage />} />
          <Route path="new" element={<NewProjectPage />} />
          <Route path="team" element={<ProjectTeamPage />} />
          <Route path="team/:projectId" element={<ProjectTeamDetailsPage />} />
          <Route
            path="team/:projectId/permissions"
            element={<ProjectPermissionsPage />}
          />
          <Route
            path="team/:projectId/:empId/permissions"
            element={<TeamPermissions />}
          />
          <Route path="counters" element={<ProjectsCountersPage />} />
          <Route path=":id/counters" element={<ProjectCountersPage />} />
          <Route path=":id" element={<ProjectDetailsPage />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default ProjectsRoutes;
