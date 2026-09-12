import { CheckCircle2, Lock } from "lucide-react";
import type { DependencyTaskRef } from "../../../hooks/tasks/useTaskDetail";

// "Dependencies — blocks / waiting on, with a green check when a blocker
// clears" (build plan D3 §6).
function DependencyRow({ item }: { item: DependencyTaskRef }) {
  const cleared = item.statusCategory === "done" || item.statusCategory === "closed";
  return (
    <div className="flex items-center gap-2 rounded-md border border-gray-100 px-2.5 py-1.5 text-sm">
      {cleared ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
      ) : (
        <Lock className="h-3.5 w-3.5 shrink-0 text-amber-500" />
      )}
      <span className="truncate text-gray-700">{item.title}</span>
    </div>
  );
}

interface DependenciesSectionProps {
  blocking: DependencyTaskRef[]; // tasks that block this one
  blockedByMe: DependencyTaskRef[]; // tasks waiting on this one
}

export default function DependenciesSection({ blocking, blockedByMe }: DependenciesSectionProps) {
  if (blocking.length === 0 && blockedByMe.length === 0) return null;

  return (
    <div className="space-y-3">
      {blocking.length > 0 && (
        <div>
          <div className="mb-1 text-xs font-semibold text-gray-500">في انتظار</div>
          <div className="space-y-1">
            {blocking.map((t) => (
              <DependencyRow key={t.id} item={t} />
            ))}
          </div>
        </div>
      )}
      {blockedByMe.length > 0 && (
        <div>
          <div className="mb-1 text-xs font-semibold text-gray-500">تحظر</div>
          <div className="space-y-1">
            {blockedByMe.map((t) => (
              <DependencyRow key={t.id} item={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
