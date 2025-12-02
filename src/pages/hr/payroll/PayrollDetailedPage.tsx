import { useParams } from "react-router-dom";
import { useDetailedPayroll } from "../../../hooks/usePayroll";

const PayrollDetailedPage = () => {
  const { id } = useParams<{ id: string }>();
  const { payroll, loading, error } = useDetailedPayroll(id || "");

  return <div>PayrollDetailedPage</div>;
};

export default PayrollDetailedPage;
