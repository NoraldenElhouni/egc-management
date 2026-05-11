import { LucideIcon } from "lucide-react";

interface StatCard {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  secondaryLabel?: string;
  secondaryValue?: string | number;
}

interface OverviewStatusProps {
  stats: StatCard[];
}

const gridCols: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
};

const OverviewStatus = ({ stats }: OverviewStatusProps) => {
  const count = Math.min(stats.length, 5);
  const colClass = gridCols[count] ?? "grid-cols-4";

  return (
    <div className={`grid grid-cols-1 md:${colClass} gap-6 mb-6`}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  {stat.secondaryValue !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {stat.secondaryLabel ?? "Secondary"}
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        {stat.secondaryValue}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className={`${stat.iconBgColor} p-3 rounded-lg`}>
                <Icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OverviewStatus;
