import { ColumnDef } from "@tanstack/react-table";
import { ContractReport } from "../../../types/global.type";
import { formatDate } from "../../../utils/helpper";

export const ContractReportColumns: ColumnDef<ContractReport>[] = [
  // Selection column (first column)
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center">
        <input
          type="checkbox"
          aria-label="Select all rows"
          ref={(el) => {
            if (el)
              el.indeterminate =
                table.getIsSomePageRowsSelected() &&
                !table.getIsAllPageRowsSelected();
          }}
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
  { accessorKey: "contract_id", header: "Contract ID" },
  { accessorKey: "project_id", header: "Project ID" },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ getValue }) => {
      const val = getValue() as number | null;
      return val == null ? "-" : val.toLocaleString();
    },
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ getValue }) => {
      return <div>{formatDate(getValue() as string)}</div>;
    },
  },
  { accessorKey: "created_by", header: "Created By" },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ getValue }) => (getValue() as string | null) ?? "-",
  },
  {
    accessorKey: "img_url",
    header: "Image",
    cell: ({ getValue }) => {
      const url = getValue() as string | null;
      return url ? (
        <img src={url} alt="img" className="w-10 h-10 object-cover rounded" />
      ) : (
        "-"
      );
    },
  },
];
