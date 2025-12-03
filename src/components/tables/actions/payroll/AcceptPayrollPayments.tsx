import { useState } from "react";
import { useAuth } from "../../../../hooks/useAuth";
import { tr } from "zod/locales";
import Button from "../../../ui/Button";

interface AcceptPayrollPaymentsProps {
  payrollPaymentId: string;
}

const AcceptPayrollPayments = ({
  payrollPaymentId,
}: AcceptPayrollPaymentsProps) => {
  const [choosing, setChoosing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleChoose = async (method: "bank" | "cash") => {
    setChoosing(false);
    setLoading(true);
    try {
      if (!user?.id) {
        console.error("User not authenticated");
        return;
      }
      console.log("Accepting payroll payment with method:", method);
    } catch (error) {
      console.error("Error accepting payroll payment:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button
        onClick={() => setChoosing(!choosing)}
        loading={loading}
        size="xs"
        variant="success"
        type="button"
      >
        قبول الدفع
      </Button>
      {choosing && (
        <div className="inline-flex gap-2 mr-2">
          <Button
            onClick={() => handleChoose("bank")}
            size="xs"
            variant="primary"
            type="button"
          >
            بنك
          </Button>
          <Button
            onClick={() => handleChoose("cash")}
            size="xs"
            variant="primary"
            type="button"
          >
            نقداً
          </Button>
        </div>
      )}
    </div>
  );
};

export default AcceptPayrollPayments;
