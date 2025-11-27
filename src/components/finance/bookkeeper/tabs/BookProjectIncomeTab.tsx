import { ProjectIncome } from "../../../../types/global.type";
import { ProjectWithDetailsForBook } from "../../../../types/projects.type";
import { ProjectsIncomeColumns } from "../../../tables/columns/ProjectIncomeColumns";
import GenericTable from "../../../tables/table";
import ProjectIncomeForm from "../../form/ProjectIncomeForm";

interface BookProjectIncomeTabProps {
  project: ProjectWithDetailsForBook | null;
  type?: "bookkeeper" | "treasury" | null;
}

const BookProjectIncomeTab = ({ project, type }: BookProjectIncomeTabProps) => {
  // ensure the component destructures `type` too: ({ project, type }: BookProjectIncomeTabProps)
  const fillteredIncomes =
    project?.project_incomes?.filter((income: ProjectIncome) => {
      // default: no filter
      if (!type || type === "treasury") return true;

      // when bookkeeper: show refunds
      if (type === "bookkeeper") return income.fund === "refund";

      return true;
    }) || [];
  return (
    <div className="space-y-4">
      <div>
        <ProjectIncomeForm projectId={project?.id || ""} type={type} />
      </div>
      <div className="flex items-center justify-end">
        <div className="text-sm font-medium">
          Total:{" "}
          {(() => {
            const total = fillteredIncomes.reduce((sum, income) => {
              const amt = Number(income.amount ?? 0) || 0;
              return sum + amt;
            }, 0);
            return total.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
          })()}
        </div>
      </div>
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
