import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import GenericTable from "../tables/table";

type User = {
  id: number;
  name: string;
  email: string;
  role: "Admin" | "Editor" | "Viewer";
  status: "Active" | "Suspended" | "Pending";
  createdAt: string;
};

// Dummy data
const dummyUsers: User[] = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice@example.com",
    role: "Admin",
    status: "Active",
    createdAt: "2024-09-15",
  },
  {
    id: 2,
    name: "Bob Smith",
    email: "bob@example.com",
    role: "Editor",
    status: "Pending",
    createdAt: "2024-10-01",
  },
  {
    id: 3,
    name: "Carla Martinez",
    email: "carla@example.com",
    role: "Viewer",
    status: "Active",
    createdAt: "2024-07-22",
  },
  {
    id: 4,
    name: "David Lee",
    email: "david@example.com",
    role: "Editor",
    status: "Suspended",
    createdAt: "2024-08-10",
  },
  {
    id: 5,
    name: "Ella Nguyen",
    email: "ella@example.com",
    role: "Viewer",
    status: "Active",
    createdAt: "2024-09-05",
  },
];

export default function UserTableWithSelectDemo() {
  const [users, setUsers] = React.useState<User[]>(dummyUsers);

  // Handle role change from select box
  const handleRoleChange = (id: number, newRole: User["role"]) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role: newRole } : u))
    );
  };

  const columns: ColumnDef<User>[] = [
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
      header: "Name",
      cell: (info) => (
        <span className="font-medium">{info.getValue() as string}</span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
    },

    // Role column with select box
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <select
            value={user.role}
            onChange={(e) =>
              handleRoleChange(user.id, e.target.value as User["role"])
            }
            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`Change role for ${user.name}`}
          >
            <option value="Admin">Admin</option>
            <option value="Editor">Editor</option>
            <option value="Viewer">Viewer</option>
          </select>
        );
      },
    },

    {
      accessorKey: "status",
      header: "Status",
      cell: (info) => {
        const status = info.getValue() as string;
        const color =
          status === "Active"
            ? "bg-green-100 text-green-700"
            : status === "Suspended"
              ? "bg-red-100 text-red-700"
              : "bg-yellow-100 text-yellow-700";
        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">
        User Management (with multi-select)
      </h2>
      <GenericTable
        data={users}
        columns={columns}
        enableSorting
        enablePagination
        enableFiltering
        enableRowSelection
        showGlobalFilter
        onRowSelectionChange={(selected) =>
          console.log("Selected rows:", selected)
        }
      />
    </div>
  );
}
