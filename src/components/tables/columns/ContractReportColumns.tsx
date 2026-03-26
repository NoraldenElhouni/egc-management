import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "../../../utils/helpper";
import { FullContractReport } from "../../../types/extended.type";
import { Link } from "react-router-dom";

export const ContractReportColumns: ColumnDef<FullContractReport>[] = [
  // ✅ Select
  {
    id: "select",
    header: ({ table }) => (
      <input
        type="checkbox"
        ref={(el) => {
          if (el)
            el.indeterminate =
              table.getIsSomePageRowsSelected() &&
              !table.getIsAllPageRowsSelected();
        }}
        onChange={table.getToggleAllPageRowsSelectedHandler()}
        checked={table.getIsAllPageRowsSelected()}
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        onChange={row.getToggleSelectedHandler()}
        checked={row.getIsSelected()}
      />
    ),
    size: 32,
  },

  // ✅ Contract ID → clickable
  {
    id: "contract",
    header: "العقد",
    cell: ({ row }) => {
      const contractId = row.original.contracts?.id;

      return contractId ? (
        <Link
          to={`/contracts/${contractId}`}
          className="text-blue-600 hover:underline font-medium"
        >
          {contractId.slice(0, 4)}
        </Link>
      ) : (
        "-"
      );
    },
  },

  // ✅ Project Name (instead of ID)
  {
    id: "project",
    header: "اسم المشروع",
    cell: ({ row }) => row.original.projects?.name ?? "-",
  },

  // ✅ Employee name
  {
    id: "employee",
    header: "المهندس",
    cell: ({ row }) => {
      const emp = row.original.employees;
      return emp ? `${emp.first_name} ${emp.last_name}` : "-";
    },
  },

  // ✅ Report Amount
  {
    accessorKey: "amount",
    header: "القيمة",
    cell: ({ getValue }) => {
      const val = getValue() as number | null;
      return val == null ? "-" : val.toLocaleString();
    },
  },

  // ✅ Contract Total Amount
  {
    id: "contract_amount",
    header: "قيمه العقد",
    cell: ({ row }) => row.original.contracts?.amount?.toLocaleString() ?? "-",
  },

  // ✅ Date
  {
    accessorKey: "created_at",
    header: "التاريخ",
    cell: ({ getValue }) => formatDate(getValue() as string),
  },

  // ✅ Description
  {
    accessorKey: "description",
    header: "الوصف",
    cell: ({ getValue }) => (getValue() as string | null) ?? "-",
  },

  // ✅ Image Preview (better UX)
  {
    accessorKey: "img_url",
    header: "الصورة",
    cell: ({ getValue }) => {
      const url = getValue() as string | null;

      if (!url) return "-";

      return (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <img
            src={url}
            alt="report"
            className="w-12 h-12 object-cover rounded hover:scale-110 transition"
          />
        </a>
      );
    },
  },
];
