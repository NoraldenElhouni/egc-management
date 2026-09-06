import { useCan } from "../../../../hooks/permissions/useCan";
import { ProjectIncome } from "../../../../types/global.type";
import { ProjectWithDetailsForBook } from "../../../../types/projects.type";
import { ProjectsIncomeColumns } from "../../../tables/columns/ProjectIncomeColumns";
import GenericTable from "../../../tables/table";
import OverviewStatus from "../../../ui/OverviewStatus";
import ProjectIncomeForm from "../../form/ProjectIncomeForm";
import { formatCurrency } from "../../../../utils/helpper";
import IncomesListPdfButton from "../../../pdf-buttons/IncomesListPdfButton";

interface BookProjectIncomeTabProps {
  project: ProjectWithDetailsForBook | null;
}

const BookProjectIncomeTab = ({ project }: BookProjectIncomeTabProps) => {
  // Issue 11/19: this used to compare user.role to the lowercase literal
  // "bookkeeper", which never matched the real role name ("Bookkeeper") —
  // the filter was dead code, and every role saw the full income list.
  // view_project_finance_income already existed in the catalog, granted
  // only to Bookkeeper, unused anywhere in code — clearly meant for
  // exactly this. Wired here to actually restrict, per decision: holding
  // it means refund-only. Defaults to restricted while the permission
  // check is still resolving, since that's the less-exposed state.
  const { can: restrictToRefunds, loading: permissionLoading } = useCan(
    "view_project_finance_income",
  );
  const fillteredIncomes =
    project?.project_incomes?.filter((income: ProjectIncome) => {
      if (permissionLoading || restrictToRefunds) {
        return income.fund === "refund";
      }
      return true;
    }) || [];

  const totalBalance =
    project?.project_balances?.reduce(
      (acc, balance) => acc + (balance.balance || 0),
      0,
    ) || 0;

  const totalAvailable = totalBalance;
  return (
    <div className="space-y-4">
      <IncomesListPdfButton projectId={project?.id ?? ""} />

      <div>
        <ProjectIncomeForm projectId={project?.id || ""} />
      </div>

      {/* Overview Stats */}
      <OverviewStatus
        stats={[
          {
            label: "إجمالي الدخل",
            value: formatCurrency(
              project?.project_incomes?.reduce(
                (acc, income) => acc + income.amount,
                0,
              ) ?? 0,
            ),
            secondaryLabel: "عدد الوداعات",
            secondaryValue: project?.project_incomes?.length || 0,
          },
          {
            label: "إجمالي الدخل (نقدي)",
            value: formatCurrency(
              project?.project_incomes?.reduce(
                (acc, income) =>
                  income.payment_method === "cash" ? acc + income.amount : acc,
                0,
              ) ?? 0,
            ),
            secondaryLabel: "إجمالي الدخل (بنكي)",
            secondaryValue: formatCurrency(
              project?.project_incomes?.reduce(
                (acc, income) =>
                  income.payment_method === "bank" ? acc + income.amount : acc,
                0,
              ) ?? 0,
            ),
          },

          {
            label: "الرصيد المتاح",
            value: formatCurrency(totalAvailable),
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
