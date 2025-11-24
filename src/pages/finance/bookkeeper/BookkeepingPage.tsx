import ProjectsList from "../../../components/project/lists/ProjectsList";

const BookkeepingPage = () => {
  return (
    <div className="p-4">
      <ProjectsList basePath="/finance/bookkeeping/projects" />
    </div>
  );
};

export default BookkeepingPage;
