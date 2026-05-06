import ProjectsList from "../../../components/project/lists/ProjectsList";

const OperationsMapsPage = () => {
  return (
    <div className="p-4 ">
      <ProjectsList basePath="/operations/maps/project" version="compact" />
    </div>
  );
};

export default OperationsMapsPage;
