import { ColumnDef } from "@tanstack/react-table";
import { Employees } from "../../../types/global.type";

export const EmployeesColumns: ColumnDef<Employees>[] = [
  // Selection column (first column)
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center">
        <input
          type="checkbox"
          aria-label="Select all rows"
          // toggle all visible (page) rows
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
    // keep this column narrow
    size: 32,
  },

  {
    accessorKey: "name",
    header: "الاسم",
    cell: ({ row }) => (
      <div>
        {row.original.first_name} {row.original.last_name}
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "البريد الإلكتروني",
  },

  // Role column with select box
  // {
  //   accessorKey: "role",
  //   header: "الدور",
  //   cell: ({ row }) => {
  //     const user = row.original;
  //     return (
  //       <select
  //         value={user.role}
  //         onChange={(e) =>
  //           handleRoleChange(user.id, e.target.value as User["role"])
  //         }
  //         className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  //         aria-label={`Change role for ${user.name}`}
  //       >
  //         <option value="Admin">Admin</option>
  //         <option value="Editor">Editor</option>
  //         <option value="Viewer">Viewer</option>
  //       </select>
  //     );
  //   },
  // },

  {
    accessorKey: "created_at",
    header: "تاريخ الإنشاء",
    cell: ({ row }) => {
      const date = new Date(row.original.created_at);
      return date.toLocaleDateString("ar-LY");
    },
  },
];
