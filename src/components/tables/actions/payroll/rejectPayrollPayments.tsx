import { useState } from "react";
import Button from "../../../ui/Button";
import { supabase } from "../../../../lib/supabaseClient";

interface RejectPayrollPaymentsProps {
  payrollPaymentId: string;
}

const RejectPayrollPayments = ({
  payrollPaymentId,
}: RejectPayrollPaymentsProps) => {
  const [loading, setLoading] = useState(false);

  const rejectPayrollPayment = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("payroll")
        .update({
          status: "rejected",
        })
        .eq("id", payrollPaymentId);
      if (error) {
        console.error("Error rejecting payroll payment:", error.message);
        alert("حدث خطأ أثناء رفض دفع الرواتب. الرجاء المحاولة مرة أخرى.");
      }
    } catch (error) {
      console.error("Error rejecting payroll payment:", error);
      alert("حدث خطأ أثناء رفض دفع الرواتب. الرجاء المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="error"
      size="xs"
      loading={loading}
      onClick={rejectPayrollPayment}
    >
      رفض
    </Button>
  );
};

export default RejectPayrollPayments;
