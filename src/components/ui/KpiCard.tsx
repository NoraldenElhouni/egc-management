import { ElementType } from "react";

type KpiTone = "indigo" | "green" | "amber" | "blue";

interface KpiCardProps {
  label: string;
  value: string;
  icon: ElementType;
  tone?: KpiTone;
}

const toneMap: Record<KpiTone, string> = {
  indigo: "bg-indigo-50 text-indigo-600",
  green: "bg-green-50 text-green-600",
  amber: "bg-amber-50 text-amber-600",
  blue: "bg-blue-50 text-blue-600",
};

const KpiCard = ({
  label,
  value,
  icon: Icon,
  tone = "indigo",
}: KpiCardProps) => {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneMap[tone]}`}
      >
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
};

export default KpiCard;
