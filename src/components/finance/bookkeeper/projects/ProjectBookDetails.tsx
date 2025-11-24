// ProjectBookDetails.tsx
import { useBookProject } from "../../../../hooks/projects/useBookProjects";
import Tabs from "../../../ui/Tabs";
import BookProjectExpenseTab from "../tabs/BookProjectExpenseTab";
import BookProjectIncomeTab from "../tabs/BookProjectIncomeTab";

const ProjectBookDetails = ({ id }: { id: string }) => {
  const { project, loading, error, addExpense } = useBookProject(id);

  const tabs = [
    {
      id: "expenses",
      label: "المصروفات",
      content: (
        <BookProjectExpenseTab project={project} addExpense={addExpense} />
      ),
    },
    {
      id: "income",
      label: "الدخل",
      content: <BookProjectIncomeTab project={project} />,
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
        <Tabs tabs={tabs} defaultTab="expenses" />
      </div>
    </div>
  );
};

export default ProjectBookDetails;
