import ProjectsList from "../../../components/project/lists/ProjectsList";

const TreasuryPage = () => {
  return (
    <div className="p-4">
      <ProjectsList basePath="/finance/treasury/project" version="compact" />
    </div>
  );
};

export default TreasuryPage;
