import ProjectsList from "../../../components/project/lists/ProjectsList";

const OperationsAgreementsPage = () => {
  return (
    <div className="p-4 ">
      <ProjectsList basePath="/operations/agreements/project" version="compact" />
    </div>
  );
};

export default OperationsAgreementsPage;
