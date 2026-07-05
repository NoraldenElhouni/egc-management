import Skeleton from "./Skeleton";

const ProjectBookDetailsSkeleton = () => {
  return (
    <div className="bg-background min-h-screen">
      {/* Tab headers */}
      <div className="px-6 py-4 border-b bg-white">
        <ul className="flex gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i}>
              <Skeleton className="h-4 w-20" />
            </li>
          ))}
        </ul>
      </div>

      <div className="p-6 space-y-4">
        {/* Action buttons row */}
        <div className="flex gap-4">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>

        {/* Stat cards (OverviewStatus) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6">
              <Skeleton className="h-3 w-20 mb-3" />
              <Skeleton className="h-6 w-24 mb-3" />
              <Skeleton className="h-3 w-28 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>

        {/* Form fields (ProjectExpenseForm) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto border rounded">
          <table className="min-w-full border-collapse table-auto">
            <thead className="bg-gray-50">
              <tr>
                {Array.from({ length: 6 }).map((_, i) => (
                  <th key={i} className="py-3 px-4">
                    <Skeleton className="h-4 w-16" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {Array.from({ length: 8 }).map((_, r) => (
                <tr key={r} className="border-b border-gray-100">
                  {Array.from({ length: 6 }).map((_, c) => (
                    <td key={c} className="py-3 px-4">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProjectBookDetailsSkeleton;
