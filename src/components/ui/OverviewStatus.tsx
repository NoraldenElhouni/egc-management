interface StatCard {
  label: string;
  value: string | number;
  secondaryLabel?: string;
  secondaryValue?: string | number;
  tertiaryLabel?: string;
  tertiaryValue?: string | number;
}

interface OverviewStatusProps {
  stats: StatCard[];
}

const OverviewStatus = ({ stats }: OverviewStatusProps) => {
  const count = Math.min(stats.length, 6);
  const isCompact = count >= 6;

  return (
    <div
      className="grid grid-cols-1 gap-4 mb-6"
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
    >
      {stats.map((stat, index) => {
        return (
          <div
            key={index}
            className={`bg-white rounded-lg shadow-sm ${isCompact ? "p-4" : "p-6"}`}
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p
                  className={`text-gray-600 mb-1 truncate ${isCompact ? "text-xs" : "text-sm"}`}
                >
                  {stat.label}
                </p>
                <div className="space-y-1">
                  <p
                    className={`font-bold text-gray-900 ${isCompact ? "text-lg" : "text-2xl"}`}
                  >
                    {stat.value}
                  </p>

                  {stat.secondaryValue !== undefined && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-xs text-gray-500">
                        {stat.secondaryLabel ?? "Secondary"}
                      </span>
                      <span className="text-xs font-medium text-gray-700">
                        {stat.secondaryValue}
                      </span>
                    </div>
                  )}

                  {stat.tertiaryValue !== undefined && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-xs text-gray-500">
                        {stat.tertiaryLabel ?? "Tertiary"}
                      </span>
                      <span className="text-xs font-medium text-gray-700">
                        {stat.tertiaryValue}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OverviewStatus;
