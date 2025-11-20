import ProjectsList from "../../../components/project/lists/ProjectsList";

const AccountingPage = () => {
  return (
    <div className="p-4">
      <ProjectsList basePath="/finance/accounting/project" />
    </div>
  );
};

export default AccountingPage;
