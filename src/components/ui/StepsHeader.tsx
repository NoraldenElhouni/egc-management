type StepsHeaderProps = {
  steps: { title: string }[];
  current: number; // 1-based
};

const StepsHeader = ({ steps, current }: StepsHeaderProps) => {
  return (
    <div className="mt-4 flex justify-center">
      <div className="inline-flex items-center gap-6 rounded-md border bg-white px-4 py-3">
        {steps.map((s, idx) => {
          const stepNumber = idx + 1;
          const isDone = stepNumber < current;
          const isActive = stepNumber === current;

          return (
            <div key={s.title} className="flex items-center gap-2">
              <div
                className={[
                  "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold",
                  isDone
                    ? "bg-green-500 text-white"
                    : isActive
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-600",
                ].join(" ")}
              >
                {isDone ? "✓" : stepNumber}
              </div>

              <div
                className={[
                  "text-sm font-medium whitespace-nowrap",
                  isActive ? "text-gray-900" : "text-gray-500",
                ].join(" ")}
              >
                {s.title}
              </div>

              {/* connector line (except last) */}
              {idx !== steps.length - 1 && (
                <div className="mx-2 h-0.5 w-10 bg-gray-200">
                  <div
                    className={[
                      "h-0.5 transition-all",
                      stepNumber < current ? "w-full bg-green-500" : "w-0",
                    ].join(" ")}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepsHeader;
