import { ColumnDef } from "@tanstack/react-table";
import { RequestMilestones } from "../../../../../types/global.type";

const MAX_DESC_LENGTH = 100;

export const RequestMilestonesColumns: ColumnDef<RequestMilestones>[] = [
  {
    id: "index",
    header: "#",
    cell: ({ row }) => (
      <span className="text-gray-400 text-sm">{row.index + 1}</span>
    ),
    size: 40,
  },
  {
    accessorKey: "title",
    header: "العنوان",
    cell: ({ getValue }) => (
      <span className="font-semibold text-gray-900">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "description",
    header: "الوصف",
    cell: ({ getValue }) => {
      const desc = getValue<string | null>();
      if (!desc) return <span className="text-gray-400 text-sm">—</span>;
      const isTruncated = desc.length > MAX_DESC_LENGTH;
      return (
        <span
          title={isTruncated ? desc : undefined}
          className="text-gray-700 text-sm cursor-default"
        >
          {isTruncated ? desc.slice(0, MAX_DESC_LENGTH) + "…" : desc}
        </span>
      );
    },
  },
  {
    accessorKey: "percentage",
    header: "النسبة %",
    cell: ({ getValue }) => (
      <span className="text-gray-700">{getValue<number>()}%</span>
    ),
  },

  {
    accessorKey: "order_index",
    header: "الترتيب",
    cell: ({ getValue }) => (
      <span className="text-gray-400 text-sm">{getValue<number>()}</span>
    ),
  },
];
