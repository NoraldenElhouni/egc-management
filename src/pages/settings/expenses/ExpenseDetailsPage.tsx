import { useParams } from "react-router-dom";

const ExpenseDetailsPage = () => {
  const params = useParams<{ id: string }>();
  const expenseId = params.id;

  return <div>ExpenseDetailsPage{expenseId}</div>;
};

export default ExpenseDetailsPage;
