import ProjectsList from "../../../components/project/lists/ProjectsList";

const PorjectsOrdersPage = () => {
  return (
    <div className="p-4 ">
      <ProjectsList basePath="/shops/orders/project" version="compact" />
    </div>
  );
};

export default PorjectsOrdersPage;
