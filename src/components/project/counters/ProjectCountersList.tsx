import { AlertTriangle, CalendarClock, Hash, Info } from "lucide-react";
import { useProjectNegativePeriods } from "../../../hooks/projects/useProjectCounters";
import { projectCountersColumns } from "../../tables/columns/ProjectCountersColumns";
import GenericTable from "../../tables/table";
import KpiCard from "../../ui/KpiCard";

interface ProjectCountersListProps {
  projectId: string;
}

const ProjectCountersList = ({ projectId }: ProjectCountersListProps) => {
  const { periods, loading, error, refetch } =
    useProjectNegativePeriods(projectId);

  if (loading)
    return (
      <div className="flex items-center justify-center gap-2 h-40 text-gray-400 text-sm">
        <i className="ti ti-loader-2 animate-spin text-lg" aria-hidden="true" />
        جارٍ تحميل العدادات...
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center gap-3 h-40 text-sm">
        <p className="text-red-500">{error.message}</p>
        <button
          onClick={refetch}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          حاول ثانية
        </button>
      </div>
    );

  const openCount = periods.filter((p) => !p.ended_on).length;
  const totalDays = periods.reduce((sum, p) => sum + (p.days_count ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="rounded-lg shadow-sm p-4 flex gap-3 items-start bg-blue-50 border border-blue-100">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
        <p className="text-sm text-blue-700">
          العداد تلقائي بالكامل، ويتم تحديثه وتشغيله يومياً الساعة 5:00 مساءً
          بتوقيت ليبيا.
        </p>
      </div>

      {periods.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 bg-white rounded-xl border border-dashed border-gray-300 text-center">
          <div className="bg-gray-50 p-4 rounded-full mb-1">
            <AlertTriangle size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">لا توجد عدادات</h3>
          <p className="text-sm text-gray-500">
            لم يدخل هذا المشروع في رصيد سالب حتى الآن.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <KpiCard
              label="عدد العدادات"
              value={String(periods.length)}
              icon={Hash}
              tone="indigo"
            />
            <KpiCard
              label="عدادات مستمرة حالياً"
              value={String(openCount)}
              icon={AlertTriangle}
              tone="amber"
            />
            <KpiCard
              label="إجمالي أيام السالب"
              value={String(totalDays)}
              icon={CalendarClock}
              tone="blue"
            />
          </div>

          <GenericTable
            data={periods}
            columns={projectCountersColumns}
            enableSorting
            initialSorting={[{ id: "started_on", desc: true }]}
          />
        </>
      )}
    </div>
  );
};

export default ProjectCountersList;
