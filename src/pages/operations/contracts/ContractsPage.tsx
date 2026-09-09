import ProjectsList from "../../../components/project/lists/ProjectsList";

const ContractsPage = () => {
  return (
    <div className="p-4 ">
      <ProjectsList
        basePath="/operations/contracts/project"
        version="contracts"
        counters={[
          {
            id: "contracts_count",
            header: "عدد العقود",
            table: "contracts",
            schema: "contracts",
          },
        ]}
      />
    </div>
  );
};

export default ContractsPage;
