import ProjectsList from "../../../components/project/lists/ProjectsList";

const ContractsPage = () => {
  return (
    <div className="p-4 ">
      <ProjectsList
        basePath="/operations/contracts/project"
        version="contracts"
      />
    </div>
  );
};

export default ContractsPage;
