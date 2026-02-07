import { useBookProject } from "../../../../hooks/projects/useBookProjects";
import Tabs from "../../../ui/Tabs";
import BookProjectExpensePercentageTab from "../tabs/BookProjectExpensePercentageTab";
import BookProjectExpenseTab from "../tabs/BookProjectExpenseTab";
import BookRefundTab from "../tabs/BookRefundTab";

const ProjectBookDetails = ({ id }: { id: string }) => {
  const { project, loading, error, addExpense, addExpensePercentage } =
    useBookProject(id);

  const tabs = [
    {
      id: "materials",
      label: "مواد",
      content: (
        <BookProjectExpenseTab project={project} addExpense={addExpense} />
      ),
    },
    {
      id: "refund",
      label: "الراجع",
      content: (
        <BookRefundTab refunds={project?.project_refund ?? []} projectId={id} />
      ),
    },
    {
      id: "percentage",
      label: "النسبة المئوية",
      content: (
        <BookProjectExpensePercentageTab
          project={project}
          addExpensePercentage={addExpensePercentage}
        />
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
