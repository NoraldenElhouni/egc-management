import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import GenericTable from "../tables/table";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import LoadingPage from "../ui/LoadingPage";
import ErrorPage from "../ui/errorPage";
import ColumnFiltersDialog, { optionsOf } from "../tables/filters/ColumnFiltersDialog";
import { useProjectAgreements } from "../../hooks/agreements/useAgreements";
import { useAuthUserId, useCan } from "../../hooks/permissions/useCan";
import type { AgreementSummary } from "../../types/agreements.types";
import { formatCurrency, formatDate } from "../../utils/helpper";
import AgreementDetailDialog from "./AgreementDetailDialog";
import AgreementFormDialog from "./AgreementFormDialog";

// The project's agreements with contractors. Click a row to open it (pay,
// edit, versions). Without view_all_project_agreements you see only the
// ones you created.

type Scope = "all" | "mine";

const STATE_LABEL: Record<string, string> = {
  pending: "دفعة قيد الانتظار",
  open: "مفتوحة",
  paid: "مدفوعة بالكامل",
};

function stateOf(a: AgreementSummary) {
  return a.has_pending ? "pending" : a.remaining <= 0 ? "paid" : "open";
}

export default function ProjectAgreementsTab({ projectId }: { projectId: string }) {
  const { userId } = useAuthUserId();
  const { can: canSeeAll } = useCan("view_all_project_agreements", projectId);
  const { can: canEdit } = useCan("edit_project_agreements", projectId);
  const { data, isLoading, error } = useProjectAgreements(projectId);
  const [scope, setScope] = useState<Scope>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const effectiveScope: Scope = canSeeAll ? scope : "mine";
  const rows = useMemo(
    () => (data ?? []).filter((a) => effectiveScope === "all" || a.created_by === userId),
    [data, effectiveScope, userId],
  );

  const columns = useMemo<ColumnDef<AgreementSummary, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "العنوان",
        cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
      },
      {
        id: "contractor",
        header: "المقاول",
        filterFn: "equalsString",
        accessorFn: (r) => r.contractor_name ?? "",
      },
      {
        accessorKey: "total",
        header: "الإجمالي",
        cell: ({ getValue }) => formatCurrency(Number(getValue())),
      },
      {
        accessorKey: "paid",
        header: "المدفوع",
        cell: ({ getValue }) => formatCurrency(Number(getValue())),
      },
      {
        accessorKey: "remaining",
        header: "المتبقي",
        cell: ({ getValue }) => (
          <span className="font-semibold text-blue-800">{formatCurrency(Number(getValue()))}</span>
        ),
      },
      {
        id: "state",
        header: "الحالة",
        filterFn: "equalsString",
        accessorFn: stateOf,
        cell: ({ row }) => {
          const s = stateOf(row.original);
          return (
            <div className="flex gap-1">
              <Badge
                label={STATE_LABEL[s]}
                variant={s === "pending" ? "warning" : s === "paid" ? "success" : "default"}
              />
              {row.original.current_version > 1 && (
                <Badge label={`إصدار ${row.original.current_version}`} variant="info" />
              )}
            </div>
          );
        },
      },
      {
        id: "created_by",
        header: "أنشأها",
        filterFn: "equalsString",
        accessorFn: (r) => r.created_by_name ?? "",
      },
      {
        accessorKey: "created_at",
        header: "التاريخ",
        cell: ({ getValue }) => formatDate(getValue<string>()),
      },
    ],
    [],
  );

  if (isLoading) return <LoadingPage />;
  if (error) return <ErrorPage error={(error as Error).message} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">الاتفاقيات</h2>
          <p className="text-sm text-gray-500">اتفاقيات المقاولين في هذا المشروع والدفعات عليها</p>
        </div>
        <div className="flex items-center gap-3">
          {canSeeAll && (
            <div className="flex rounded-lg bg-gray-100 p-1 text-sm">
              {(
                [
                  { value: "all", label: "كل الاتفاقيات" },
                  { value: "mine", label: "اتفاقياتي" },
                ] as const
              ).map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setScope(s.value)}
                  className={`px-3 py-1.5 rounded-md font-medium transition ${
                    scope === s.value ? "bg-white text-primary shadow-sm" : "text-gray-600"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
          <Button type="button" onClick={() => setNewOpen(true)}>
            <Plus className="w-4 h-4 ml-1" /> اتفاقية جديدة
          </Button>
        </div>
      </div>

      <GenericTable<AgreementSummary>
        data={rows}
        columns={columns}
        enableSorting
        enableFiltering
        enablePagination
        showGlobalFilter
        pageSize={10}
        onRowClick={(a) => setOpenId(a.id)}
        emptyMessage="لا توجد اتفاقيات بعد."
        searchAdornment={(table) => (
          <ColumnFiltersDialog
            table={table}
            filters={[
              { columnId: "contractor", label: "المقاول", options: optionsOf(rows.map((r) => r.contractor_name)) },
              {
                columnId: "state",
                label: "الحالة",
                options: Object.entries(STATE_LABEL).map(([value, label]) => ({ value, label })),
              },
              { columnId: "created_by", label: "أنشأها", options: optionsOf(rows.map((r) => r.created_by_name)) },
            ]}
          />
        )}
      />

      <AgreementDetailDialog
        projectId={projectId}
        agreementId={openId}
        onClose={() => setOpenId(null)}
        canEdit={canEdit}
        canPay={(createdBy) => canSeeAll || createdBy === userId}
      />
      <AgreementFormDialog
        projectId={projectId}
        isOpen={newOpen}
        onClose={() => setNewOpen(false)}
        onSaved={(id) => setOpenId(id)}
      />
    </div>
  );
}
