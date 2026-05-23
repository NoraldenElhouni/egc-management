import { useState } from "react";
import { RequestBids } from "../../types/contracts.type";
import { supabase } from "../../lib/supabaseClient";
import { formatCurrency } from "../../utils/helpper";

interface AcceptBidDialogProps {
  bid: RequestBids;
  onClose: () => void;
  onSuccess: () => void;
}

const AcceptBidDialog = ({ bid, onClose, onSuccess }: AcceptBidDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState("");

  async function handleAccept() {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("غير مصرح");

      const project = bid.work_requests.projects;

      // 1. Get percentage rate (cash by default since no payment yet)
      const { data: pp, error: ppError } = await supabase
        .from("project_percentage")
        .select("percentage, total_percentage, period_percentage")
        .eq("project_id", project.id)
        .eq("currency", "LYD")
        .eq("type", "cash")
        .maybeSingle();

      if (ppError) throw ppError;

      const rate = (pp?.percentage ?? 0) / 100;

      // 2. Fetch a fresh snapshot of counters from DB (props may be stale)
      const { data: freshProject, error: freshErr } = await supabase
        .from("projects")
        .select("expense_counter, invoice_counter")
        .eq("id", project.id)
        .single();

      if (freshErr) throw freshErr;

      // 3. Increment counters FIRST (reserve the serial slot before inserting),
      //    using optimistic concurrency to guard against races.
      const { error: counterErr } = await supabase
        .from("projects")
        .update({
          expense_counter: freshProject.expense_counter + 1,
          invoice_counter: freshProject.invoice_counter + 1,
        })
        .eq("id", project.id)
        // Only update if no other operation has already bumped the counter
        .eq("expense_counter", freshProject.expense_counter);

      if (counterErr) throw counterErr;

      // 4. Insert expense using the reserved serial number
      const { data: expense, error: expenseErr } = await supabase
        .from("project_expenses")
        .insert([
          {
            project_id: project.id,
            description: `عقد: ${bid.work_requests.title}`,
            total_amount: bid.total_price,
            expense_date: new Date().toISOString().split("T")[0],
            created_by: user.id,
            phase: "construction" as const,
            expense_type: "labor" as const,
            status: "unpaid" as const,
            amount_paid: 0,
            serial_number: freshProject.expense_counter, // the slot we just reserved
            contractor_id: bid.contractor_id,
            currency: "LYD" as const,
          },
        ])
        .select()
        .single();

      if (expenseErr) throw expenseErr;

      // 5. Update project_balances (invoice-based — affects total_expense and percentage even before payment)
      const invoicePercentage = bid.total_price * rate;
      const netDelta = bid.total_price + invoicePercentage;

      const { data: balanceData, error: balanceError } = await supabase
        .from("project_balances")
        .select("*")
        .eq("project_id", project.id)
        .eq("currency", "LYD")
        .single();

      if (balanceError) throw balanceError;

      const { error: balanceUpdateError } = await supabase
        .from("project_balances")
        .update({
          balance: (balanceData.balance || 0) - netDelta,
          total_expense: (balanceData.total_expense || 0) + bid.total_price,
          total_percentage:
            (balanceData.total_percentage || 0) + invoicePercentage,
        })
        .eq("id", balanceData.id);

      if (balanceUpdateError) throw balanceUpdateError;

      // 6. Accept the winning bid
      const { error: bidErr } = await supabase
        .from("contractor_bids")
        .update({
          status: "accepted",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", bid.id);

      if (bidErr) throw bidErr;

      // 7. Reject all other bids for this request
      const { error: rejectErr } = await supabase
        .from("contractor_bids")
        .update({ status: "rejected", reviewed_at: new Date().toISOString() })
        .eq("request_id", bid.request_id)
        .neq("id", bid.id);

      if (rejectErr) throw rejectErr;

      // 8. Mark work request as awarded
      const { error: requestErr } = await supabase
        .from("work_requests")
        .update({ status: "awarded" })
        .eq("id", bid.request_id);

      if (requestErr) throw requestErr;

      // 9. Create the contract
      const { error: contractErr } = await supabase.from("contracts").insert({
        project_id: project.id,
        request_id: bid.request_id,
        winning_bid_id: bid.id,
        contractor_id: bid.contractor_id,
        created_by: user.id,
        total_amount: bid.total_price,
        days_allocated: bid.days_needed,
        status: "active" as const,
        start_date: startDate || null,
        end_date: endDate || null,
      });

      if (contractErr) throw contractErr;

      // 10. Increment expense payment counter
      await supabase
        .from("project_expenses")
        .update({ payment_counter: expense.payment_counter + 1 })
        .eq("id", expense.id);

      onSuccess();
    } catch (err) {
      console.error(err);
      setError("حدث خطأ");
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          تأكيد قبول العرض
        </h2>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">المقاول</span>
            <span className="font-medium">
              {bid.contractors.first_name} {bid.contractors.last_name ?? ""}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">الطلب</span>
            <span className="font-medium">{bid.work_requests.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">المشروع</span>
            <span className="font-medium">
              {bid.work_requests.projects.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">إجمالي العرض</span>
            <span className="font-semibold text-green-700">
              {formatCurrency(bid.total_price)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">المدة</span>
            <span className="font-medium">{bid.days_needed} يوم</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">
              تاريخ البداية
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">
              تاريخ الانتهاء
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
          قبول العرض سيُنشئ عقداً تلقائياً وسيتم رفض باقي العروض. سيُسجَّل
          المبلغ كمصروف غير مدفوع.
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleAccept}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? "جاري القبول..." : "تأكيد القبول"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AcceptBidDialog;
