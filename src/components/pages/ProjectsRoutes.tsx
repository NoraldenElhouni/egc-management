import { Route } from "react-router-dom";
import ProjectsLayout from "../sidebar/ProjectsLayout";
import ProjectsPage from "../../pages/projects/Projects";
import NewProjectPage from "../../pages/projects/NewProject";
import ProjectTeamPage from "../../pages/projects/team/ProjectTeamPage";
import ProjectTeamDetailsPage from "../../pages/projects/team/id/ProjectTeamDetailsPage";
import ProjectDetailsPage from "../../pages/projects/ProjectDetail";

const ProjectsRoutes = () => {
  return (
    <Route element={<ProjectsLayout />}>
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/projects/new" element={<NewProjectPage />} />
      <Route path="/projects/team" element={<ProjectTeamPage />} />
      <Route
        path="/projects/team/:projectId"
        element={<ProjectTeamDetailsPage />}
      />
      <Route path="/projects/:id" element={<ProjectDetailsPage />} />
    </Route>
  );
};

export default ProjectsRoutes;
