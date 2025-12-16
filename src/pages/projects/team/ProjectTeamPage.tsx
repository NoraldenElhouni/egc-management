import ProjectsList from "../../../components/project/lists/ProjectsList";

const ProjectTeamPage = () => {
  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">فريق المشروع</h1>
        <p className="mb-4 mt-1 text-gray-600 ">
          هنا يمكنك إدارة فريق المشروع الخاص بك.
        </p>
      </div>
      <ProjectsList basePath="/projects/team" />
    </div>
  );
};

export default ProjectTeamPage;
