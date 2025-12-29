import { Route, Routes } from "react-router-dom";
import ProjectsLayout from "../sidebar/ProjectsLayout";
import ProjectsPage from "../../pages/projects/Projects";
import NewProjectPage from "../../pages/projects/NewProject";
import ProjectTeamPage from "../../pages/projects/team/ProjectTeamPage";
import ProjectTeamDetailsPage from "../../pages/projects/team/id/ProjectTeamDetailsPage";
import ProjectDetailsPage from "../../pages/projects/ProjectDetail";

const ProjectsRoutes = () => {
  return (
    <Routes>
      <Route element={<ProjectsLayout />}>
        <Route index element={<ProjectsPage />} />
        <Route path="new" element={<NewProjectPage />} />
        <Route path="team" element={<ProjectTeamPage />} />
        <Route path="team/:projectId" element={<ProjectTeamDetailsPage />} />
        <Route path=":id" element={<ProjectDetailsPage />} />
      </Route>
    </Routes>
  );
};

export default ProjectsRoutes;
