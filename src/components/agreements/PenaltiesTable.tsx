import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import GenericTable from "../tables/table";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import LoadingPage from "../ui/LoadingPage";
import ErrorPage from "../ui/errorPage";
import ColumnFiltersDialog, { optionsOf } from "../tables/filters/ColumnFiltersDialog";
import {
  agreementErrorMessage,
  attachmentUrl,
  useDecidePenalty,
  usePenalties,
} from "../../hooks/agreements/useAgreements";
import type { PenaltyDisplayStatus, PenaltyRow } from "../../types/agreements.types";
import { PENALTY_STATUS } from "../../utils/agreements/versions";
import { formatCurrency, formatDate } from "../../utils/helpper";
import PenaltyFormDialog from "./PenaltyFormDialog";

// Penalties, two ways:
//  - on a project page (projectId set): that project's penalties + "new"
//  - in the payments queue (projectId null): every project's, with
//    accept / decline on the pending ones

type Props = {
  projectId: string | null;
  /** Project page: show the "new penalty" button. */
  canCreate?: boolean;
  /** Payments queue: accept / decline column. */
  canDecide?: boolean;
};

export default function PenaltiesTable({ projectId, canCreate, canDecide }: Props) {
  const { data, isLoading, error } = usePenalties(projectId);
  const [newOpen, setNewOpen] = useState(false);
  const rows = data ?? [];

  const columns = useMemo<ColumnDef<PenaltyRow, unknown>[]>(
    () => [
      {
        id: "contractor",
        header: "المقاول",
        filterFn: "equalsString",
        accessorFn: (r) => r.contractor_name ?? "",
        cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
      },
      ...(projectId
        ? []
        : [
            {
              id: "project",
              header: "المشروع",
              filterFn: "equalsString",
              accessorFn: (r: PenaltyRow) => r.project_name,
            } as ColumnDef<PenaltyRow, unknown>,
          ]),
      {
        accessorKey: "amount",
        header: "المبلغ",
        cell: ({ getValue }) => (
          <span className="font-semibold text-red-700">{formatCurrency(Number(getValue()))}</span>
        ),
      },
      { accessorKey: "reason", header: "السبب" },
      {
        // the evidence, before accept / decline
        id: "photos",
        header: "الصور",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.attachments?.length ? (
            <div className="flex gap-1">
              {row.original.attachments.map((a) => {
                const url = attachmentUrl(a.file_path);
                return (
                  <a key={a.file_path} href={url} target="_blank" rel="noreferrer" title="فتح الصورة">
                    <img src={url} alt="" className="h-10 w-10 rounded object-cover border" />
                  </a>
                );
              })}
            </div>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          ),
      },
      {
        id: "status",
        header: "الحالة",
        filterFn: "equalsString",
        accessorFn: (r) => r.display_status,
        cell: ({ row }) => {
          const s = PENALTY_STATUS[row.original.display_status];
          return (
            <div className="flex flex-col gap-0.5">
              <Badge label={s.label} variant={s.variant} />
              {row.original.display_status === "deducted" && row.original.payment_number && (
                <span className="text-xs text-gray-500">من الدفعة رقم {row.original.payment_number}</span>
              )}
            </div>
          );
        },
      },
      {
        id: "created_by",
        header: "سجّلها",
        filterFn: "equalsString",
        accessorFn: (r) => r.created_by_name ?? "",
      },
      {
        accessorKey: "created_at",
        header: "التاريخ",
        cell: ({ getValue }) => formatDate(getValue<string>()),
      },
      ...(canDecide
        ? [
            {
              id: "actions",
              header: "الإجراءات",
              enableSorting: false,
              cell: ({ row }) => <PenaltyActionsCell penalty={row.original} />,
            } as ColumnDef<PenaltyRow, unknown>,
          ]
        : []),
    ],
    [projectId, canDecide],
  );

  if (isLoading) return <LoadingPage />;
  if (error) return <ErrorPage error={(error as Error).message} />;

  return (
    <div className="space-y-4">
      {canCreate && projectId && (
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">الغرامات</h2>
            <p className="text-sm text-gray-500">
              تُعتمد من شاشة مدفوعات المقاولين، ثم تُخصم تلقائياً من أول دفعة للمقاول في المشروع
            </p>
          </div>
          <Button type="button" variant="error" onClick={() => setNewOpen(true)}>
            <Plus className="w-4 h-4 ml-1" /> غرامة جديدة
          </Button>
        </div>
      )}

      <GenericTable<PenaltyRow>
        data={rows}
        columns={columns}
        enableSorting
        enableFiltering
        enablePagination
        showGlobalFilter
        pageSize={10}
        emptyMessage="لا توجد غرامات."
        searchAdornment={(table) => (
          <ColumnFiltersDialog
            table={table}
            filters={[
              {
                columnId: "status",
                label: "الحالة",
                options: (Object.keys(PENALTY_STATUS) as PenaltyDisplayStatus[]).map((s) => ({
                  value: s,
                  label: PENALTY_STATUS[s].label,
                })),
              },
              ...(projectId
                ? []
                : [{ columnId: "project", label: "المشروع", options: optionsOf(rows.map((r) => r.project_name)) }]),
              { columnId: "contractor", label: "المقاول", options: optionsOf(rows.map((r) => r.contractor_name)) },
              { columnId: "created_by", label: "سجّلها", options: optionsOf(rows.map((r) => r.created_by_name)) },
            ]}
          />
        )}
      />

      {projectId && <PenaltyFormDialog projectId={projectId} isOpen={newOpen} onClose={() => setNewOpen(false)} />}
    </div>
  );
}

function PenaltyActionsCell({ penalty }: { penalty: PenaltyRow }) {
  const decide = useDecidePenalty();
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);
  const isPending = penalty.status === "pending";

  const run = (approve: boolean) => {
    setBusy(approve ? "accept" : "decline");
    decide.mutate(
      { penaltyId: penalty.id, approve },
      {
        onError: (err) => window.alert(agreementErrorMessage(err)),
        onSettled: () => setBusy(null),
      },
    );
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        type="button"
        variant="success"
        size="xs"
        disabled={!isPending || !!busy}
        loading={busy === "accept"}
        onClick={() => run(true)}
      >
        قبول
      </Button>
      <Button
        type="button"
        variant="error"
        size="xs"
        disabled={!isPending || !!busy}
        loading={busy === "decline"}
        onClick={() => run(false)}
      >
        رفض
      </Button>
    </div>
  );
}
