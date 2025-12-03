import { useState } from "react";
import { useAuth } from "../../../../hooks/useAuth";
import Button from "../../../ui/Button";
import { supabase } from "../../../../lib/supabaseClient";

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
        alert("User not authenticated");
        return;
      }

      const { data: accountData, error: accountError } = await supabase
        .from("accounts")
        .select("id")
        .eq("type", method === "bank" ? "bank" : "cash")
        .eq("owner_type", "company")
        .eq("currency", "LYD")
        .limit(1)
        .single();

      if (accountError || !accountData) {
        console.error("Error fetching account data:", accountError);
        alert("حدث خطأ أثناء جلب بيانات الحساب. الرجاء المحاولة مرة أخرى.");
        return;
      }

      const { data, error } = await supabase.rpc("accept_payroll_payment", {
        p_payroll_id: payrollPaymentId,
        p_account_id: accountData?.id,
        p_approved_by: user.id,
        p_payment_method: method,
      });

      if (error) {
        console.error("Error calling RPC:", error);
        alert("حدث خطأ أثناء قبول دفع الرواتب: " + error.message);
        return;
      }

      // data is an array of the returned row(s); our function returns (success, message)
      const resp = Array.isArray(data) ? data[0] : data;
      if (!resp) {
        console.error("Unexpected RPC response", data);
        alert("Unexpected response from server.");
        return;
      }

      if (resp.success) {
        alert("تم قبول الدفع وتسجيل المصاريف بنجاح.");
      } else {
        console.error("RPC reported failure:", resp.message);
        if (resp.message === "Insufficient funds in selected account") {
          alert("فشل: رصيد غير كافٍ في حساب الشركة لمعالجة دفع الرواتب.");
        } else {
          alert("فشل: " + resp.message);
        }
      }
    } catch (err) {
      console.error("Error accepting payroll payment:", err);
      alert("حدث خطأ. الرجاء المحاولة مرة أخرى.");
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
