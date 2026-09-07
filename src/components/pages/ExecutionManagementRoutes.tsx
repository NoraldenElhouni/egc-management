import { Route, Routes } from "react-router-dom";
import RequirePermission from "../auth/RequirePermission";
import ExecutionManagementPage from "../../pages/execution-management/ExecutionManagementPage";
import ExecutionManagementLayout from "../sidebar/ExecutionManagementLayout";
import ExecutionManagementProjectPage from "../../pages/execution-management/projects/ExecutionManagementProjectPage";
import ProjectTeamDetailsPage from "../../pages/execution-management/projects/ProjectTeamDetailsPage";
import ProjectPermissionsPage from "../../pages/execution-management/projects/ProjectPermissionsPage";
import AllProjectTeamsPage from "../../pages/execution-management/projects/AllProjectTeamsPage";

const ExecutionManagementRoutes = () => {
  return (
    <Routes>
      <Route element={<RequirePermission permission="manage_execution" />}>
        <Route element={<ExecutionManagementLayout />}>
          <Route index element={<ExecutionManagementPage />} />
          <Route path="projects" element={<ExecutionManagementProjectPage />} />

          {/* Every project's team on one page, with editing in place.

              Ranked ABOVE projects/:projectId deliberately — React Router
              scores a static segment higher than a dynamic one, so
              "teams" is never swallowed as a project id. Project ids are
              uuids, so the two can never genuinely collide.

              Gated on view_all_project_teams, which is company-wide on
              purpose: view_project_team is is_project_scoped = true and
              the resolver force-denies a project-scoped permission asked
              without a project (DECISION 3), so it cannot gate a page
              about all projects at once. Note this sits inside the
              section's manage_execution guard too, so both are required
              — Admin and Manager hold both, so that costs nobody access
              today. Editing any single project from this page is still
              gated on manage_project_team, resolved per project inside
              the page itself. */}
          <Route
            element={<RequirePermission permission="view_all_project_teams" />}
          >
            <Route path="projects/teams" element={<AllProjectTeamsPage />} />
          </Route>

          {/* Team management, moved here from /projects/team/*.
              
              The guard route CARRIES :projectId itself rather than being a
              pathless wrapper around it. That is load-bearing, not style:
              manage_project_team is is_project_scoped = true, and the
              resolver returns false for a project-scoped permission asked
              without a project (phase2-resolver.sql, DECISION 3). React
              Router only exposes a param to the element of a route whose
              own path declares it, so a pathless wrapper would have no
              projectId to pass and would deny everyone — Admin included,
              which is exactly what it did until this was fixed. */}
          <Route
            path="projects/:projectId"
            element={<RequirePermission permission="manage_project_team" />}
          >
            <Route index element={<ProjectTeamDetailsPage />} />

            {/* manage_permissions_project is company-wide (is_project_scoped
                = false), so this one is fine as a plain nested guard. */}
            <Route
              element={
                <RequirePermission permission="manage_permissions_project" />
              }
            >
              <Route path="permissions" element={<ProjectPermissionsPage />} />
            </Route>
          </Route>
        </Route>
      </Route>
    </Routes>
  );
};

export default ExecutionManagementRoutes;
