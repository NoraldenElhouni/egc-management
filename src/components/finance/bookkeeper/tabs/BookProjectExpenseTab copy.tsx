// BookProjectExpenseTab.tsx
import { ProjectWithDetailsForBook } from "../../../../types/projects.type";
import { ProjectsExpensesColumns } from "../../../tables/columns/ProjectExpenseColumns";
import GenericTable from "../../../tables/table";
import ProjectExpenseForm from "../../form/ProjectExpenseForm";
import { ProjectExpenseFormValues } from "../../../../types/schema/ProjectBook.schema";
import { PostgrestError } from "@supabase/supabase-js";
import { ProjectExpenses } from "../../../../types/global.type";
import OverviewStatus from "../../../ui/OverviewStatus";
import { Hash } from "lucide-react";
import Button from "../../../ui/Button";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useProjectExpenseActions } from "../../../../hooks/projects/useBookProjects";

interface BookProjectExpenseTabProps {
  project: ProjectWithDetailsForBook | null;
  addExpense: (data: ProjectExpenseFormValues) => Promise<{
    data: ProjectExpenses | null;
    error: PostgrestError | null;
  }>;
}

const BookProjectExpenseTab = ({
  project,
  addExpense,
}: BookProjectExpenseTabProps) => {
  const [editingExpense, setEditingExpense] = useState<ProjectExpenses | null>(
    null,
  );
  const { updateExpense, deleteExpense } = useProjectExpenseActions();

  const closeEdit = () => setEditingExpense(null);

  return (
    <div className="space-y-4">
      <Button variant="secondary">
        <Link to={`./bulk-expenses`}>إضافة مصروفات بالجملة</Link>
      </Button>

      <OverviewStatus
        stats={[
          {
            label: "اجمالي المصروفات",
            value:
              project?.project_expenses?.reduce(
                (acc, expense) => acc + (expense.total_amount || 0),
                0,
              ) || 0,
            icon: Hash,
            iconBgColor: "bg-green-100",
            iconColor: "text-green-600",
          },
          {
            label: "إجمالي مصروفات المدفوعه",
            value:
              project?.project_expenses?.reduce(
                (acc, expense) => acc + (expense.amount_paid || 0),
                0,
              ) || 0,
            icon: Hash,
            iconBgColor: "bg-green-100",
            iconColor: "text-green-600",
          },
          {
            label: "اجمالي المحجوز",
            value:
              project?.project_balances?.reduce(
                (acc, b) => acc + (b.held || 0),
                0,
              ) || 0,
            icon: Hash,
            iconBgColor: "bg-green-100",
            iconColor: "text-green-600",
          },
          {
            label: "اجمالي المتاح",
            value:
              project?.project_balances?.reduce(
                (acc, b) => acc + (b.balance || 0),
                0,
              ) || 0,
            icon: Hash,
            iconBgColor: "bg-green-100",
            iconColor: "text-green-600",
          },
        ]}
      />

      {/* Add expense */}
      <ProjectExpenseForm
        projectId={project?.id || ""}
        addExpense={addExpense}
      />

      {/* Edit dialog */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-5xl rounded-lg bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="font-semibold text-gray-900">
                تعديل المصروف رقم {editingExpense.serial_number ?? "-"}
              </h3>
              <button
                onClick={closeEdit}
                className="text-gray-500 hover:text-gray-800"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              <ProjectExpenseForm
                projectId={project?.id || ""}
                editingExpense={editingExpense}
                onCancelEdit={closeEdit}
                onUpdate={async (vals) => {
                  // ✅ منع تقليل الإجمالي تحت المدفوع + الخصم
                  const paid = Number(editingExpense.amount_paid || 0);
                  const disc = Number(editingExpense.Discounting || 0);
                  const newTotal = Number(vals.total_amount || 0);

                  if (newTotal < paid + disc) {
                    alert(
                      `لا يمكن جعل الإجمالي أقل من (المدفوع + الخصم) = ${(paid + disc).toLocaleString()} LYD`,
                    );
                    return {
                      success: false,
                      error: "total أقل من المدفوع+الخصم",
                    };
                  }

                  // ✅ لازم currency حقيقي
                  const currency =
                    (editingExpense as any).currency || vals.currency;
                  if (!currency) {
                    alert(
                      "العملة غير متوفرة لهذا المصروف. لازم تخزن currency في project_expenses.",
                    );
                    return { success: false, error: "currency missing" };
                  }

                  const res = await updateExpense({
                    expense_id: editingExpense.id,
                    description: vals.description ?? null,
                    total_amount: vals.total_amount,
                    expense_date: vals.date,
                    expense_type: vals.type,
                    phase: vals.phase,
                    currency: currency,
                    contractor_id: vals.contractor_id ?? null,
                    expense_ref_id: vals.expense_id ?? null,
                  });

                  if (!res.success) {
                    alert(res.error);
                    return res;
                  }

                  window.location.reload();
                  return res;
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <GenericTable
        enableFiltering
        showGlobalFilter
        enableSorting
        enableRowSelection
        initialSorting={[{ id: "serial_number", desc: true }]}
        data={project?.project_expenses || []}
        columns={ProjectsExpensesColumns({
          onEdit: (e) => setEditingExpense(e),
          onDelete: async (e) => {
            // ✅ لا تحذف إذا عليه دفعات (آمن)
            if ((e.amount_paid || 0) > 0) {
              alert("لا يمكن حذف مصروف عليه دفعات. احذف الدفعات أولاً.");
              return;
            }

            if (!confirm("هل أنت متأكد من حذف المصروف؟")) return;

            const currency = (e as any).currency; // لازم تكون موجودة
            if (!currency) {
              alert(
                "العملة غير متوفرة لهذا المصروف. لازم تخزن currency في project_expenses.",
              );
              return;
            }

            const res = await deleteExpense({ expense_id: e.id, currency });

            if (!res.success) {
              alert(res.error);
              return;
            }

            window.location.reload();
          },
        })}
      />
    </div>
  );
};

export default BookProjectExpenseTab;
