import { useBookProject } from "../../../../hooks/projects/useBookProjects";
import Tabs from "../../../ui/Tabs";
import BookProjectExpenseTab from "../tabs/BookProjectExpenseTab";

const ProjectBookDetails = ({ id }: { id: string }) => {
  const { project, loading, error, addExpense } = useBookProject(id);

  const tabs = [
    {
      id: "materials",
      label: "مواد",
      content: (
        <BookProjectExpenseTab project={project} addExpense={addExpense} />
      ),
    },
    {
      id: "labor",
      label: "عمالة",
      content: (
        <BookProjectExpenseTab project={project} addExpense={addExpense} />
      ),
    },
  ];

  if (loading) {
    return <div>جاري التحميل...</div>;
  }
  if (error) {
    return <div>خطأ في تحميل المشروع: {error.message}</div>;
  }
  return (
    <div>
      <div>
        <Tabs tabs={tabs} defaultTab="materials" />
      </div>
    </div>
  );
};

export default ProjectBookDetails;
