import { Activity, DollarSign, Hash } from "lucide-react";
import { useAuth } from "../../../../hooks/useAuth";
import { ProjectIncome } from "../../../../types/global.type";
import { ProjectWithDetailsForBook } from "../../../../types/projects.type";
import { ProjectsIncomeColumns } from "../../../tables/columns/ProjectIncomeColumns";
import GenericTable from "../../../tables/table";
import OverviewStatus from "../../../ui/OverviewStatus";
import ProjectIncomeForm from "../../form/ProjectIncomeForm";

interface BookProjectIncomeTabProps {
  project: ProjectWithDetailsForBook | null;
}

const BookProjectIncomeTab = ({ project }: BookProjectIncomeTabProps) => {
  const { user } = useAuth();
  const fillteredIncomes =
    project?.project_incomes?.filter((income: ProjectIncome) => {
      // default: no filter

      // when bookkeeper: show refunds
      if (user?.role === "bookkeeper") return income.fund === "refund";

      return true;
    }) || [];

  const totalBalance =
    project?.project_balances?.reduce(
      (acc, balance) => acc + (balance.balance || 0),
      0
    ) || 0;

  const totalHeld =
    project?.project_balances?.reduce(
      (acc, balance) => acc + (balance.held || 0),
      0
    ) || 0;

  const totalAvailable = totalBalance - totalHeld;
  return (
    <div className="space-y-4">
      <div>
        <ProjectIncomeForm projectId={project?.id || ""} />
      </div>

      {/* Overview Stats */}
      <OverviewStatus
        stats={[
          {
            label: "إجمالي الدخل",
            value:
              project?.project_incomes?.reduce(
                (acc, income) => acc + income.amount,
                0
              ) ?? 0,
            icon: Hash,
            iconBgColor: "bg-blue-100",
            iconColor: "text-blue-600",
            secondaryLabel: "عدد الوداعات",
            secondaryValue: project?.project_incomes?.length || 0,
          },
          {
            label: "إجمالي الدخل (نقدي)",
            value:
              project?.project_incomes?.reduce(
                (acc, income) =>
                  income.payment_method === "cash" ? acc + income.amount : acc,
                0
              ) ?? 0,
            icon: DollarSign,
            iconBgColor: "bg-green-100",
            iconColor: "text-green-600",
            secondaryLabel: "إجمالي الدخل (بنكي)",
            secondaryValue:
              project?.project_incomes?.reduce(
                (acc, income) =>
                  income.payment_method === "bank" ||
                  income.payment_method === "cheque"
                    ? acc + income.amount
                    : acc,
                0
              ) ?? 0,
          },
          {
            label: "الرصيد المحتجز",
            value: totalHeld,
            icon: Activity,
            iconBgColor: "bg-orange-100",
            iconColor: "text-orange-600",
          },
          {
            label: "الرصيد المتاح",
            value: totalAvailable,
            icon: DollarSign,
            iconBgColor: "bg-green-100",
            iconColor: "text-green-600",
          },
        ]}
      />
      <GenericTable
        enableFiltering
        enableSorting
        showGlobalFilter
        enablePagination
        initialSorting={[{ id: "serial_number", desc: true }]}
        data={fillteredIncomes || []}
        columns={ProjectsIncomeColumns}
      />
    </div>
  );
};

export default BookProjectIncomeTab;
