import Skeleton from "../ui/loading/Skeleton";

// =====================================================================
// Loading skeletons for the Tasks module. Every page used to show a lone
// centred spinner while its data loaded; these draw the page's own shape
// instead (header, filter bar, groups of rows / cards), so the layout does
// not jump when the data arrives.
//
// Each export matches one family of pages:
//   TaskListPageSkeleton   header + grouped task rows — by-assignee / by-type /
//                          by-project, space, department, my-work, board
//   SpaceCardsPageSkeleton the Tasks home: search + grid of space cards
//   AdminPageSkeleton      templates / fields / space settings
//   PerformancePageSkeleton the performance dashboard
//   TaskDetailSkeleton     the task slide-over
//   RowsSkeleton           a short list inside a tab or panel
// Skeleton itself is the shared grey pulse block (ui/loading/Skeleton.tsx).
// =====================================================================

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

function PageHeaderSkeleton({ tools = 3 }: { tools?: number }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
      <Skeleton className="h-5 w-40" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-56 rounded-lg" />
        {range(tools - 1).map((i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function TaskRowSkeleton({ widthClass }: { widthClass: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-gray-50 px-3 py-2.5">
      <Skeleton className="h-4 w-4 rounded" />
      <Skeleton className={`h-4 ${widthClass}`} />
      <div className="flex-1" />
      <Skeleton className="h-5 w-20 rounded-full" />
      <Skeleton className="h-5 w-5 rounded-full" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

const ROW_WIDTHS = ["w-64", "w-48", "w-72", "w-56", "w-40"];

export function TaskListPageSkeleton({ groups = 3, rowsPerGroup = 4 }: { groups?: number; rowsPerGroup?: number }) {
  return (
    <div className="flex h-full flex-col" dir="rtl" aria-busy="true" aria-label="جارٍ التحميل">
      <PageHeaderSkeleton />
      <div className="flex-1 space-y-6 overflow-hidden px-6 py-5">
        {range(groups).map((g) => (
          <div key={g} className="space-y-1">
            <div className="mb-2 flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-6 rounded-full" />
            </div>
            {range(rowsPerGroup - (g % 2)).map((r) => (
              <TaskRowSkeleton key={r} widthClass={ROW_WIDTHS[(g + r) % ROW_WIDTHS.length]} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SpaceCardsPageSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="flex h-full flex-col gap-5 p-6" dir="rtl" aria-busy="true" aria-label="جارٍ التحميل">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-full max-w-md rounded-lg" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {range(cards).map((i) => (
          <div key={i} className="space-y-3 rounded-xl border border-gray-100 bg-white p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminPageSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 p-6" dir="rtl" aria-busy="true" aria-label="جارٍ التحميل">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>
      <div className="flex gap-2 border-b border-gray-100 pb-2">
        {range(4).map((i) => (
          <Skeleton key={i} className="h-7 w-20 rounded-md" />
        ))}
      </div>
      <RowsSkeleton rows={items} />
    </div>
  );
}

export function RowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="جارٍ التحميل">
      {range(rows).map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className={`h-4 ${i % 2 ? "w-40" : "w-56"}`} />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-6 w-16 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function PerformancePageSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="جارٍ التحميل">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {range(4).map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-14" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {range(2).map((i) => (
          <div key={i} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
            <Skeleton className="h-3 w-24" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 bg-gray-50 p-3">
          <Skeleton className="h-3 w-full" />
        </div>
        {range(6).map((i) => (
          <div key={i} className="flex items-center gap-3 border-t border-gray-100 p-3">
            <Skeleton className="h-3 w-4" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-40" />
            <div className="flex-1" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="h-4 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TaskDetailSkeleton() {
  return (
    <div className="flex-1 space-y-5 overflow-hidden p-5" aria-busy="true" aria-label="جارٍ التحميل">
      <Skeleton className="h-6 w-3/4" />
      <div className="grid grid-cols-2 gap-3">
        {range(6).map((i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-full rounded-md" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-11/12" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        {range(3).map((i) => (
          <Skeleton key={i} className="h-9 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}
