import { ColumnDef } from "@tanstack/react-table";
import { translateExpenseStatus } from "../../../utils/translations";
import { getExpenseStatusColor } from "../../../utils/colors/status";
import { ContractPaymentWithRelations } from "../../../types/extended.type";
import AcceptContractPayments from "../actions/payments/AcceptContractPayments";
import DeleteContractPayments from "../actions/payments/DeleteContractPyaments";

interface ContractPaymentsColumnsConfig {
  onRefetch?: () => void;
}

type ExpenseStatus =
  | "pending"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled";

const toNum = (v: unknown): number =>
  typeof v === "number" ? v : Number(v || 0);

const getContractorName = (
  contractors: ContractPaymentWithRelations["contractors"]
): string => {
  if (!contractors) return "N/A";
  return `${contractors.first_name} ${contractors.last_name || ""}`.trim();
};

const getEmployeeName = (
  employee: ContractPaymentWithRelations["employee"]
): string => {
  if (!employee) return "N/A";
  return `${employee.first_name} ${employee.last_name || ""}`.trim();
};

const getProjectName = (
  contracts: ContractPaymentWithRelations["contracts"]
): string => {
  return contracts?.projects?.name || "N/A";
};

export const createContractPaymentsColumns = (
  config?: ContractPaymentsColumnsConfig
): ColumnDef<ContractPaymentWithRelations>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center">
        <input
          type="checkbox"
          aria-label="Select all rows"
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          checked={table.getIsAllPageRowsSelected()}
          className="w-4 h-4 rounded border-gray-300"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center">
        <input
          type="checkbox"
          aria-label={`Select row ${row.index + 1}`}
          onChange={row.getToggleSelectedHandler()}
          checked={row.getIsSelected()}
          className="w-4 h-4 rounded border-gray-300"
        />
      </div>
    ),
    size: 32,
  },

  {
    accessorKey: "description",
    header: "الوصف",
    cell: ({ row }) => {
      const description = row.original.description || "N/A";
      return (
        <div
          className="max-w-[220px] truncate whitespace-nowrap"
          title={description}
        >
          {description}
        </div>
      );
    },
  },

  {
    accessorKey: "amount",
    header: "المبلغ",
    cell: ({ row }) => (
      <div className="font-medium whitespace-nowrap">
        {toNum(row.original.amount).toLocaleString()} LYD
      </div>
    ),
  },

  {
    accessorKey: "contractor_id",
    header: "المقاول",
    accessorFn: (row) => getContractorName(row.contractors),
    cell: ({ row }) => {
      const name = getContractorName(row.original.contractors);
      return (
        <div className="max-w-[160px] truncate whitespace-nowrap" title={name}>
          {name}
        </div>
      );
    },
  },

  {
    accessorKey: "contract_id",
    header: "المشروع/العقد",
    accessorFn: (row) => getProjectName(row.contracts),
    cell: ({ row }) => {
      const projectName = getProjectName(row.original.contracts);
      return (
        <div
          className="max-w-[160px] truncate whitespace-nowrap"
          title={projectName}
        >
          <span className="underline cursor-pointer">{projectName}</span>
        </div>
      );
    },
    size: 160,
  },

  {
    accessorKey: "created_by",
    header: "منشئ السجل",
    accessorFn: (row) => getEmployeeName(row.employee),
    cell: ({ row }) => {
      const name = getEmployeeName(row.original.employee);
      return (
        <div className="whitespace-nowrap" title={name}>
          {name}
        </div>
      );
    },
  },

  {
    accessorKey: "created_at",
    header: "تاريخ الإنشاء",
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        {row.original.created_at
          ? new Date(row.original.created_at).toLocaleDateString()
          : "N/A"}
      </div>
    ),
  },

  {
    accessorKey: "status",
    header: "الحالة",
    cell: ({ row }) => {
      const status = (row.original.status as ExpenseStatus) || "pending";
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getExpenseStatusColor(status)}`}
        >
          {translateExpenseStatus(status)}
        </span>
      );
    },
  },

  {
    id: "actions",
    header: "إجراءات",
    size: 280,
    cell: ({ row }) => (
      <div className="flex justify-center gap-2">
        <AcceptContractPayments
          contractPaymentId={row.original.id}
          onSuccess={config?.onRefetch}
        />
        {/* <EditContractPayments contractPaymentId={row.original.id} /> */}
        <DeleteContractPayments
          contractPaymentId={row.original.id}
          onSuccess={config?.onRefetch}
        />
      </div>
    ),
  },
];

// Backward compatibility export
export const ContractPaymentsColumns = createContractPaymentsColumns();
