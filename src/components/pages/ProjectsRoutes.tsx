import { Route, Routes } from "react-router-dom";
import ProjectsLayout from "../sidebar/ProjectsLayout";
import ProjectsPage from "../../pages/projects/Projects";
import NewProjectPage from "../../pages/projects/NewProject";
import ProjectTeamPage from "../../pages/projects/team/ProjectTeamPage";
import ProjectTeamDetailsPage from "../../pages/projects/team/id/ProjectTeamDetailsPage";
import TeamPermissions from "../../pages/projects/team/id/permissions/TeamPermissions";
import ProjectDetailsPage from "../../pages/projects/ProjectDetailsPage";
import ProjectsCountersPage from "../../pages/projects/ProjectsCountersPage";
import ProjectCountersPage from "../../pages/projects/ProjectCountersPage";

const ProjectsRoutes = () => {
  return (
    <Routes>
      <Route element={<ProjectsLayout />}>
        <Route index element={<ProjectsPage />} />
        <Route path="new" element={<NewProjectPage />} />
        <Route path="team" element={<ProjectTeamPage />} />
        <Route path="team/:projectId" element={<ProjectTeamDetailsPage />} />
        <Route
          path="team/:projectId/:empId/permissions"
          element={<TeamPermissions />}
        />
        <Route path="counters" element={<ProjectsCountersPage />} />
        <Route path=":id/counters" element={<ProjectCountersPage />} />
        <Route path=":id" element={<ProjectDetailsPage />} />
      </Route>
    </Routes>
  );
};

export default ProjectsRoutes;
