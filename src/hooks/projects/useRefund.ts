import { useState } from "react";
import { useAuth } from "../useAuth";
import { supabase } from "../../lib/supabaseClient";

export function useRefund(projectId: string) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const deleteRefund = async (refundId: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) return { success: false, message: "المستخدم غير مصرح له" };
      if (!refundId) return { success: false, message: "refundId مطلوب" };

      // 1) fetch refund row
      const { data: refundRow, error: refundFetchError } = await supabase
        .from("project_refund")
        .select("id, project_id, amount, currency, payment_method")
        .eq("id", refundId)
        .eq("project_id", projectId)
        .single();

      if (refundFetchError || !refundRow) {
        console.error("Error fetching refund before delete", refundFetchError);
        return { success: false, message: "حدث خطأ أثناء جلب الاسترداد" };
      }

      const amount = Number(refundRow.amount || 0);
      const currency = refundRow.currency;
      const paymentMethod = refundRow.payment_method; // cash/bank

      // 2) fetch project percentage (same as add)
      const { data: projectPercentage, error: projectPercentageError } =
        await supabase
          .from("project_percentage")
          .select("*")
          .eq("project_id", refundRow.project_id)
          .eq("type", paymentMethod)
          .eq("currency", currency)
          .single();

      if (projectPercentageError || !projectPercentage) {
        console.error(
          "Error fetching project percentage",
          projectPercentageError,
        );
        return { success: false, message: "حدث خطأ أثناء جلب نسبة المشروع" };
      }

      // 3) fetch project account
      const { data: projectAccount, error: projectAccountError } =
        await supabase
          .from("accounts")
          .select("*")
          .eq("owner_id", refundRow.project_id)
          .eq("owner_type", "project")
          .eq("type", paymentMethod === "cash" ? "cash" : "bank")
          .eq("currency", currency)
          .single();

      if (projectAccountError || !projectAccount) {
        console.error("Error fetching project account", projectAccountError);
        return { success: false, message: "حدث خطأ أثناء جلب حساب المشروع" };
      }

      // 4) fetch project balance
      const { data: projectBalance, error: projectBalanceError } =
        await supabase
          .from("project_balances")
          .select("*")
          .eq("project_id", refundRow.project_id)
          .eq("currency", currency)
          .single();

      if (projectBalanceError || !projectBalance) {
        console.error("Error fetching project balance", projectBalanceError);
        return { success: false, message: "حدث خطأ أثناء جلب رصيد المشروع" };
      }

      // Compute same amounts used in addRefund
      const rate = (projectPercentage.percentage || 0) / 100;
      const percentageAmount = amount * rate;
      const totalAmount = amount + percentageAmount;

      // 5) delete refund row
      const { error: deleteError } = await supabase
        .from("project_refund")
        .delete()
        .eq("id", refundId);

      if (deleteError) {
        console.error("Error deleting refund", deleteError);
        return { success: false, message: "حدث خطأ أثناء حذف الاسترداد" };
      }

      // 6) reverse project percentage (add back what we subtracted in addRefund)
      const { error: projectPercentageUpdateError } = await supabase
        .from("project_percentage")
        .update({
          period_percentage:
            (projectPercentage.period_percentage || 0) + percentageAmount,
          total_percentage:
            (projectPercentage.total_percentage || 0) + percentageAmount,
        })
        .eq("id", projectPercentage.id);

      if (projectPercentageUpdateError) {
        console.error(
          "Error updating project percentage after delete",
          projectPercentageUpdateError,
        );
        return { success: false, message: "حدث خطأ أثناء تحديث نسبة المشروع" };
      }

      // 7.1) delete percentage log for this refund
      const { error: percentageLogDeleteError } = await supabase
        .from("project_percentage_logs")
        .delete()
        .eq("refund_id", refundId);

      if (percentageLogDeleteError) {
        console.error(
          "Error deleting project percentage log after refund delete",
          percentageLogDeleteError,
        );
        return {
          success: false,
          message: "حدث خطأ أثناء حذف سجل نسبة المشروع الخاص بالاسترداد",
        };
      }

      // 7) reverse account updates
      const { error: projectAccountUpdateError } = await supabase
        .from("accounts")
        .update({
          balance: Number(projectAccount.balance || 0) - totalAmount,
          refund: Number(projectAccount.refund || 0) - totalAmount,
          total_percentage:
            Number(projectAccount.total_percentage || 0) + percentageAmount,
          total_expense: Number(projectAccount.total_expense || 0) + amount,
        })
        .eq("id", projectAccount.id);

      if (projectAccountUpdateError) {
        console.error(
          "Error updating project account after delete",
          projectAccountUpdateError,
        );
        return { success: false, message: "حدث خطأ أثناء تحديث حساب المشروع" };
      }

      // 8) reverse project balance updates
      const { error: projectBalanceUpdateError } = await supabase
        .from("project_balances")
        .update({
          balance: Number(projectBalance.balance || 0) - totalAmount,
          total_expense: Number(projectBalance.total_expense || 0) + amount,
          refund: Number(projectBalance.refund || 0) - totalAmount,
          total_percentage:
            Number(projectBalance.total_percentage || 0) + percentageAmount,
        })
        .eq("id", projectBalance.id);

      if (projectBalanceUpdateError) {
        console.error(
          "Error updating project balance after delete",
          projectBalanceUpdateError,
        );
        return { success: false, message: "حدث خطأ أثناء تحديث رصيد المشروع" };
      }

      return { success: true };
    } catch (err) {
      console.error("Error in deleteRefund", err);
      setError(err as Error);
      return { success: false, message: "حدث خطأ غير متوقع" };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    deleteRefund,
  };
}
