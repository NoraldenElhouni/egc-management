import { AlertTriangle, CalendarClock, Hash, Info } from "lucide-react";
import {
  AccountNegativePeriod,
  NegativePeriod,
  useAccountNegativePeriods,
  useProjectNegativePeriods,
} from "../../../hooks/projects/useProjectCounters";
import { projectCountersColumns } from "../../tables/columns/ProjectCountersColumns";
import GenericTable from "../../tables/table";
import KpiCard from "../../ui/KpiCard";

interface ProjectCountersListProps {
  projectId: string;
}

interface CounterSectionProps {
  title: string;
  periods: (NegativePeriod | AccountNegativePeriod)[];
  loading: boolean;
  error: { message: string } | null;
  refetch: () => void;
  emptyText: string;
}

const CounterSection = ({
  title,
  periods,
  loading,
  error,
  refetch,
  emptyText,
}: CounterSectionProps) => {
  if (loading)
    return (
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
        <div className="flex items-center justify-center gap-2 h-40 text-gray-400 text-sm">
          <i
            className="ti ti-loader-2 animate-spin text-lg"
            aria-hidden="true"
          />
          جارٍ تحميل العدادات...
        </div>
      </div>
    );

  if (error)
    return (
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
        <div className="flex flex-col items-center justify-center gap-3 h-40 text-sm">
          <p className="text-red-500">{error.message}</p>
          <button
            onClick={refetch}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            حاول ثانية
          </button>
        </div>
      </div>
    );

  const openCount = periods.filter((p) => !p.ended_on).length;
  const totalDays = periods.reduce((sum, p) => sum + (p.days_count ?? 0), 0);

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-700">{title}</h2>

      {periods.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 bg-white rounded-xl border border-dashed border-gray-300 text-center">
          <div className="bg-gray-50 p-4 rounded-full mb-1">
            <AlertTriangle size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">لا توجد عدادات</h3>
          <p className="text-sm text-gray-500">{emptyText}</p>
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

const ProjectCountersList = ({ projectId }: ProjectCountersListProps) => {
  const projectCounters = useProjectNegativePeriods(projectId);
  const accountCounters = useAccountNegativePeriods(projectId);

  return (
    <div className="space-y-6">
      <div className="rounded-lg shadow-sm p-4 flex gap-3 items-start bg-blue-50 border border-blue-100">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
        <p className="text-sm text-blue-700">
          العداد تلقائي بالكامل، ويتم تحديثه وتشغيله يومياً الساعة 5:00 مساءً
          بتوقيت ليبيا.
        </p>
      </div>

      <CounterSection
        title="عداد رصيد المشروع"
        periods={projectCounters.periods}
        loading={projectCounters.loading}
        error={projectCounters.error}
        refetch={projectCounters.refetch}
        emptyText="لم يدخل هذا المشروع في رصيد سالب حتى الآن."
      />

      <CounterSection
        title="عداد رصيد الحساب"
        periods={accountCounters.periods}
        loading={accountCounters.loading}
        error={accountCounters.error}
        refetch={accountCounters.refetch}
        emptyText="لم يدخل حساب هذا المشروع في رصيد سالب حتى الآن."
      />
    </div>
  );
};

export default ProjectCountersList;
