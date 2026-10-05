import { Send } from "lucide-react";

// Waits at the top of a board until its new tasks are pushed or
// dismissed — see useTemplateSync.ts for what counts as "new". A banner
// rather than a popup per task, so adding several tasks in a row asks
// once.
export default function TemplateSyncBanner({
  isTemplate,
  pendingCount,
  onPush,
  onDismiss,
}: {
  isTemplate: boolean;
  pendingCount: number;
  onPush: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-6 py-2 text-sm" dir="rtl">
      <span className="text-amber-800">
        {isTemplate
          ? `${pendingCount} مهام جديدة غير موجودة في اللوحات التي تستخدم هذا القالب`
          : `${pendingCount} مهام جديدة غير موجودة في القالب`}
      </span>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={onPush}
          className="flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700"
        >
          <Send className="h-3.5 w-3.5" />
          {isTemplate ? "إضافة إلى اللوحات" : "إضافة إلى القالب واللوحات"}
        </button>
        <button onClick={onDismiss} className="text-xs text-amber-700 hover:text-amber-900">
          تجاهل
        </button>
      </div>
    </div>
  );
}
