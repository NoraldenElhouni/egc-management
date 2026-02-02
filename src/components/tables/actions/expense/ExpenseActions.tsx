import { Link } from "react-router-dom";

type Props = { projectId: string; expenseId: string };

export function ExpenseActionsDropdown({ projectId, expenseId }: Props) {
  return (
    <div className="relative inline-block">
      <details className="group">
        <summary className="cursor-pointer list-none select-none rounded border px-3 py-1 text-sm">
          إجراءات ▾
        </summary>

        {/* overlay menu */}
        <div
          className="
            absolute top-full mt-2 z-[9999]
            min-w-[160px] overflow-hidden rounded border bg-white shadow
            right-0
          "
        >
          <Link
            to={`/finance/bookkeeping/project/${projectId}/expense/${expenseId}`}
            className="block px-3 py-2 text-sm hover:bg-gray-100"
          >
            عرض التفاصيل
          </Link>

          <Link
            to={`/finance/bookkeeping/project/${projectId}/expense/${expenseId}/edit`}
            className="block px-3 py-2 text-sm hover:bg-gray-100"
          >
            تعديل
          </Link>

          <Link
            to={`/finance/bookkeeping/project/${projectId}/expense/${expenseId}/delete`}
            className="block px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
          >
            حذف
          </Link>
        </div>
      </details>

      {/* optional: close icon spacing / remove default marker */}
      <style>{`
        summary::-webkit-details-marker { display: none; }
      `}</style>
    </div>
  );
}
