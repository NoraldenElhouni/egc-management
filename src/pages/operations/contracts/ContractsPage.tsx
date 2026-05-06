import ProjectsList from "../../../components/project/lists/ProjectsList";

const ContractsPage = () => {
  return (
    <div className="p-4 ">
      <ProjectsList
        basePath="/operations/contracts/project"
        version="compact"
      />
    </div>
  );
};

export default ContractsPage;
