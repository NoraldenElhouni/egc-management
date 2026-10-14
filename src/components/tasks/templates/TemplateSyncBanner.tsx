import { RefreshCw, Send } from "lucide-react";

// Waits at the top of a board until its new tasks are pushed or
// dismissed — see useTemplateSync.ts for what counts as "new". A banner
// rather than a popup per task, so adding several tasks in a row asks
// once. On a template it also says when existing tasks were edited (or
// removed) after boards took their copies, and opens the review dialog.
export default function TemplateSyncBanner({
  isTemplate,
  pendingCount,
  changedCount = 0,
  removedCount = 0,
  onPush,
  onDismiss,
  onReviewChanges,
}: {
  isTemplate: boolean;
  pendingCount: number;
  changedCount?: number;
  removedCount?: number;
  onPush: () => void;
  onDismiss: () => void;
  onReviewChanges?: () => void;
}) {
  const hasChanges = isTemplate && (changedCount > 0 || removedCount > 0) && !!onReviewChanges;
  const changeText = [
    changedCount > 0 ? `${changedCount} ${changedCount === 1 ? "مهمة تغيّرت" : "مهام تغيّرت"}` : null,
    removedCount > 0 ? `${removedCount} ${removedCount === 1 ? "نسخة محذوفة من القالب" : "نسخ محذوفة من القالب"}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="border-b border-amber-200 bg-amber-50 text-sm" dir="rtl">
      {pendingCount > 0 && (
        <div className="flex items-center justify-between gap-3 px-6 py-2">
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
      )}
      {hasChanges && (
        <div className={`flex items-center justify-between gap-3 px-6 py-2 ${pendingCount > 0 ? "border-t border-amber-200/70" : ""}`}>
          <span className="text-amber-800">{changeText} منذ استخدام القالب في اللوحات</span>
          <button
            onClick={onReviewChanges}
            className="flex shrink-0 items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            مراجعة وتحديث اللوحات
          </button>
        </div>
      )}
    </div>
  );
}
