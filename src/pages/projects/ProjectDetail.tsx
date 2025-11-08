import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import ProjectHeader from "../../components/project/ProjectHeader";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Code,
  MapPin,
  TrendingDown,
} from "lucide-react";
import { formatCurrency } from "../../utils/helpper";
import { Project } from "../../types/global.type";

const mockExpenses = [
  {
    id: "1",
    project_id: "1",
    description: "Concrete foundation materials",
    total_amount: 15000,
    payment_method: "bank_transfer",
    expense_date: "2025-11-01",
    phase: "foundation",
    expense_type: "materials",
    status: "paid",
    amount_paid: 15000,
    created_by: "user-1",
  },
  {
    id: "2",
    project_id: "1",
    description: "Labour costs - week 1",
    total_amount: 8500,
    payment_method: "cash",
    expense_date: "2025-11-03",
    phase: "foundation",
    expense_type: "labour",
    status: "pending",
    amount_paid: 0,
    created_by: "user-2",
  },
  {
    id: "3",
    project_id: "1",
    description: "Equipment rental - excavator",
    total_amount: 5200,
    payment_method: "bank_transfer",
    expense_date: "2025-11-05",
    phase: "site_preparation",
    expense_type: "equipment",
    status: "paid",
    amount_paid: 5200,
    created_by: "user-1",
  },
  {
    id: "4",
    project_id: "1",
    description: "Steel reinforcement bars",
    total_amount: 12300,
    payment_method: "bank_transfer",
    expense_date: "2025-11-06",
    phase: "foundation",
    expense_type: "materials",
    status: "paid",
    amount_paid: 12300,
    created_by: "user-3",
  },
  {
    id: "5",
    project_id: "1",
    description: "Site safety equipment",
    total_amount: 3400,
    payment_method: "cash",
    expense_date: "2025-11-08",
    phase: "site_preparation",
    expense_type: "safety",
    status: "pending",
    amount_paid: 0,
    created_by: "user-1",
  },
];

const statusColors = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  partially_paid: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
};

const expenseTypeLabels = {
  materials: "Materials",
  labour: "Labour",
  equipment: "Equipment",
  safety: "Safety",
  services: "Services",
  other: "Other",
};

const phaseLabels = {
  site_preparation: "Site Preparation",
  foundation: "Foundation",
  construction: "Construction",
  finishing: "Finishing",
};

const totalAmount = mockExpenses.reduce(
  (sum, exp) => sum + exp.total_amount,
  0
);
const totalPaid = mockExpenses.reduce((sum, exp) => sum + exp.amount_paid, 0);
export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>(); // id may be undefined typewise

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Project ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const fetchProject = async () => {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("id", id)
          .single();
        if (data) {
          setProject(data);
        } else {
          console.error("Project not found for id:", id, error);
          setError(error ? error.message : "Project not found.");
        }
      } catch (err: unknown) {
        console.error("Error fetching project:", err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  if (loading) return <div>جاري تحميل المشروع…</div>;
  if (error)
    return (
      <div>
        <p className="text-error">{error}</p>
      </div>
    );
  if (!project) return <div>المشروع غير موجود</div>;

  return (
    <div className="p-6">
      <ProjectHeader project={project} />
      <div className="mb-8">
        <div className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Project Code */}
            <div className="flex items-start gap-3">
              <Code className="w-5 h-5 text-slate-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Project Code
                </p>
                <p className="text-base font-semibold text-foreground">
                  {project.code}
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-slate-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Location
                </p>
                <p className="text-base font-semibold text-foreground">
                  {project.address}
                </p>
              </div>
            </div>

            {/* Created Date */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-slate-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Created
                </p>
                <p className="text-base font-semibold text-foreground">
                  {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>actions</div>
      <div className="container mx-auto py-8 px-4">
        {/* Project Information div */}

        {/* Expenses Section */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-border">
              <div className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Total Expenses
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(totalAmount)}
                    </p>
                  </div>
                  <TrendingDown className="w-10 h-10 text-red-500 opacity-50" />
                </div>
              </div>
            </div>

            <div className="border border-border">
              <div className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Amount Paid
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(totalPaid)}
                    </p>
                  </div>
                  <CheckCircle2 className="w-10 h-10 text-green-500 opacity-50" />
                </div>
              </div>
            </div>

            <div className="border border-border">
              <div className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Pending Amount
                    </p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {formatCurrency(totalAmount - totalPaid)}
                    </p>
                  </div>
                  <Clock className="w-10 h-10 text-yellow-500 opacity-50" />
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">
                      Description
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">
                      Type
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">
                      Phase
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">
                      Paid
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">
                      Method
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockExpenses.map((expense, idx) => (
                    <tr
                      key={expense.id}
                      className={`border-b border-border hover:bg-slate-50 transition-colors ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                      }`}
                    >
                      <td className="px-6 py-4 text-sm text-foreground font-medium">
                        {expense.description}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          {expenseTypeLabels[
                            expense.expense_type as keyof typeof expenseTypeLabels
                          ] || expense.expense_type}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {phaseLabels[
                          expense.phase as keyof typeof phaseLabels
                        ] || expense.phase}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-foreground">
                        {formatCurrency(expense.total_amount)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">
                        {formatCurrency(expense.amount_paid)}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground capitalize">
                        {expense.payment_method.replace("_", " ")}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(expense.expense_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div
                          className={
                            statusColors[
                              expense.status as keyof typeof statusColors
                            ] || "bg-gray-100 text-gray-800"
                          }
                        >
                          {expense.status.charAt(0).toUpperCase() +
                            expense.status.slice(1)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* <ProjectExpensesList expenses={mockExpenses} /> */}
        </div>
      </div>
      <div className="mt-4"></div>
    </div>
  );
}
