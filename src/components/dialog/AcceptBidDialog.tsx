import { useEffect, useState } from "react";
import { RequestBids } from "../../types/contracts.type";
import { supabase } from "../../lib/supabaseClient";
import { formatCurrency } from "../../utils/helpper";
import { CalendarDays } from "lucide-react";

interface AcceptBidDialogProps {
  bid: RequestBids;
  onClose: () => void;
  onSuccess: () => void;
}

type MilestoneWithDate = {
  id: string;
  title: string;
  description: string | null;
  percentage: number;
  order_index: number;
  due_date: string; // user fills this in
};

const AcceptBidDialog = ({ bid, onClose, onSuccess }: AcceptBidDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState("");
  useEffect(() => {
    if (!startDate) return;
    const end = new Date(startDate);
    end.setDate(end.getDate() + bid.days_needed);
    setEndDate(end.toISOString().split("T")[0]);
  }, [startDate, bid.days_needed]);

  // ── milestones ──────────────────────────────────────────────────────────────
  const [milestones, setMilestones] = useState<MilestoneWithDate[]>([]);
  const [milestonesLoading, setMilestonesLoading] = useState(true);

  useEffect(() => {
    async function fetchMilestones() {
      setMilestonesLoading(true);
      const { data } = await supabase
        .from("request_milestones")
        .select("id, title, description, percentage, order_index")
        .eq("request_id", bid.request_id)
        .order("order_index", { ascending: true });

      setMilestones((data ?? []).map((m) => ({ ...m, due_date: "" })));
      setMilestonesLoading(false);
    }
    fetchMilestones();
  }, [bid.request_id]);

  function setMilestoneDueDate(id: string, date: string) {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, due_date: date } : m)),
    );
  }

  const allMilestoneDatesSet =
    milestones.length === 0 || milestones.every((m) => m.due_date !== "");

  // ── accept logic ─────────────────────────────────────────────────────────────
  async function handleAccept() {
    if (!allMilestoneDatesSet) {
      setError("يرجى تحديد تاريخ الاستحقاق لكل مرحلة قبل المتابعة.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("غير مصرح");

      const project = bid.work_requests.projects;

      // 1. percentage rate
      const { data: pp, error: ppError } = await supabase
        .from("project_percentage")
        .select("percentage, total_percentage, period_percentage")
        .eq("project_id", project.id)
        .eq("currency", "LYD")
        .eq("type", "cash")
        .maybeSingle();
      if (ppError) throw ppError;

      const rate = (pp?.percentage ?? 0) / 100;

      // 2. fresh counters
      const { data: freshProject, error: freshErr } = await supabase
        .from("projects")
        .select("expense_counter, invoice_counter")
        .eq("id", project.id)
        .single();
      if (freshErr) throw freshErr;

      // 3. increment counters
      const { error: counterErr } = await supabase
        .from("projects")
        .update({
          expense_counter: freshProject.expense_counter + 1,
          invoice_counter: freshProject.invoice_counter + 1,
        })
        .eq("id", project.id)
        .eq("expense_counter", freshProject.expense_counter);
      if (counterErr) throw counterErr;

      // 4. insert expense
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
            serial_number: freshProject.expense_counter,
            contractor_id: bid.contractor_id,
            currency: "LYD" as const,
          },
        ])
        .select()
        .single();
      if (expenseErr) throw expenseErr;

      // 5. update project_balances
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

      // 6. accept winning bid
      const { error: bidErr } = await supabase
        .from("contractor_bids")
        .update({
          status: "accepted",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", bid.id);
      if (bidErr) throw bidErr;

      // 7. reject other bids
      const { error: rejectErr } = await supabase
        .from("contractor_bids")
        .update({ status: "rejected", reviewed_at: new Date().toISOString() })
        .eq("request_id", bid.request_id)
        .neq("id", bid.id);
      if (rejectErr) throw rejectErr;

      // 8. mark request as awarded
      const { error: requestErr } = await supabase
        .from("work_requests")
        .update({ status: "awarded" })
        .eq("id", bid.request_id);
      if (requestErr) throw requestErr;

      // 9. create contract
      const { data: contract, error: contractErr } = await supabase
        .from("contracts")
        .insert({
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
          expense_id: expense.id,
        })
        .select("id")
        .single();
      if (contractErr) throw contractErr;

      // 10. transfer milestones → contract_milestones
      if (milestones.length > 0) {
        const milestoneAmount = bid.total_price / milestones.length;

        const { error: milestonesErr } = await supabase
          .from("contract_milestones")
          .insert(
            milestones.map((m) => ({
              contract_id: contract.id,
              title: m.title,
              description: m.description,
              amount: milestoneAmount,
              due_date: m.due_date || null,
              status: "pending" as const,
              order_index: m.order_index,
              source_milestone_id: m.id,
            })),
          );
        if (milestonesErr) throw milestonesErr;
      }

      // 11. increment expense payment counter
      await supabase
        .from("project_expenses")
        .update({ payment_counter: expense.payment_counter + 1 })
        .eq("id", expense.id);

      onSuccess();
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء معالجة العملية");
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-900">
          تأكيد قبول العرض
        </h2>

        {/* bid summary */}
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

        {/* contract dates */}
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

        {/* milestones */}
        {milestonesLoading ? (
          <div className="text-sm text-gray-400 text-center py-2">
            جاري تحميل المراحل...
          </div>
        ) : milestones.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">
                مواعيد المراحل
              </h3>
              <span className="text-xs text-gray-400">
                ({milestones.length} مرحلة)
              </span>
            </div>

            <div className="border border-gray-100 rounded-lg divide-y divide-gray-100">
              {milestones.map((m, index) => (
                <div key={m.id} className="p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    {/* index bubble */}
                    <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {m.title}
                      </p>
                      {m.description && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                          {m.description}
                        </p>
                      )}
                    </div>
                    {m.percentage > 0 && (
                      <>
                        <span className="flex-shrink-0 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          {m.percentage}%
                        </span>
                        <span className="flex-shrink-0 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          {formatCurrency(
                            (bid.total_price * m.percentage) / 100,
                          )}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pr-7">
                    <label className="text-xs text-gray-500 whitespace-nowrap">
                      تاريخ الاستحقاق
                    </label>
                    <input
                      type="date"
                      value={m.due_date}
                      min={startDate || undefined}
                      onChange={(e) =>
                        setMilestoneDueDate(m.id, e.target.value)
                      }
                      className={`flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                        m.due_date === "" && error
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* info banner */}
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
            disabled={loading || !allMilestoneDatesSet}
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
