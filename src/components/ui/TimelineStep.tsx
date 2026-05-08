// components/ui/RequestTimeline.tsx

import Separator from "./separator";

interface TimelineStep {
  title: string;
  subtitle?: string;
  status: "done" | "current" | "pending";
}

interface RequestTimelineProps {
  steps: TimelineStep[];
}

const dotStyles: Record<TimelineStep["status"], string> = {
  done: "bg-emerald-500",
  current: "bg-blue-500",
  pending: "bg-gray-300",
};

const RequestTimeline = ({ steps }: RequestTimelineProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6" dir="rtl">
      <h2 className="font-semibold text-gray-900 mb-4">مسار الطلب</h2>
      <Separator />
      <div className="mt-4 flex flex-col gap-0">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start gap-4">
            {/* Dot + line */}
            <div className="flex flex-col items-center">
              <div
                className={`w-3 h-3 rounded-full mt-1 shrink-0 ${dotStyles[step.status]}`}
              />
              {index < steps.length - 1 && (
                <div className="w-px flex-1 bg-gray-200 my-1 min-h-[2rem]" />
              )}
            </div>

            {/* Content */}
            <div className="pb-6">
              <p
                className={`text-sm font-bold ${
                  step.status === "pending" ? "text-gray-400" : "text-gray-900"
                }`}
              >
                {step.title}
              </p>
              {step.subtitle && (
                <p className="text-xs text-gray-400 mt-0.5">{step.subtitle}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RequestTimeline;
