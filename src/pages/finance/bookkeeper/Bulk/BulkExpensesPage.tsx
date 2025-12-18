import { useParams } from "react-router-dom";
import ProjectExpenseBulkForm from "../../../../components/finance/form/ProjectExpenseSheetForm";

const BulkExpensesPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <div>معرف المشروع غير موجود في المعاملات.</div>;
  }
  return (
    <div>
      <ProjectExpenseBulkForm projectId={id} />
    </div>
  );
};

export default BulkExpensesPage;
