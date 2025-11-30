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
  return (
    <div className="space-y-4">
      <div>
        <ProjectIncomeForm projectId={project?.id || ""} />
      </div>

      {/* Overview Stats */}
      <OverviewStatus
        stats={[
          {
            label: "عدد اليداعات",
            value: project?.project_incomes?.length || 0,
            icon: Hash,
            iconBgColor: "bg-blue-100",
            iconColor: "text-blue-600",
          },
          {
            label: "إجمالي الدخل للمشروع",
            value:
              project?.project_incomes?.reduce(
                (acc, income) => acc + income.amount,
                0
              ) || 0,
            icon: DollarSign,
            iconBgColor: "bg-green-100",
            iconColor: "text-green-600",
          },
          {
            label: "",
            value: 0,
            icon: Activity,
            iconBgColor: "bg-orange-100",
            iconColor: "text-orange-600",
          },
          {
            label: "",
            value: 0,
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
