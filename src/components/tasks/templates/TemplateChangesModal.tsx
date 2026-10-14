import { useEffect, useMemo, useRef, useState } from "react";
import { X, Loader2, RefreshCw, ArrowLeft, Trash2 } from "lucide-react";
import {
  TEMPLATE_FIELD_LABELS,
  useTemplateChangeActions,
  useTemplateChanges,
  type TemplateSyncReport,
} from "../../../hooks/tasks/useTemplateSync";
import { extractErrorMessage } from "../../../hooks/tasks/extractErrorMessage";

// Template edits -> the boards that used the template. Opened from the
// template's TemplateSyncBanner ("مراجعة"). Same shape as the "add new
// tasks" push (PushToBoardsModal): pick what to send, pick the boards,
// confirm. Nothing changes on a board until then.
//
// A field the board's team changed themselves is never overwritten: the
// board keeps its own value and the report says so. (The database decides —
// tasks.sync_template_changes compares each copy with what it was when it
// last synced.)

const PRIORITY_LABELS: Record<string, string> = { urgent: "عاجلة", high: "عالية", normal: "عادية", low: "منخفضة" };

/** A short, readable value for the few fields that have one; null = show only the field name. */
function shortValue(key: string, value: unknown): string | null {
  if (value === null || value === undefined) return "—";
  if (key === "title" || key === "status") return typeof value === "string" ? value : null;
  if (key === "priority") return typeof value === "string" ? (PRIORITY_LABELS[value] ?? value) : null;
  if (key === "duration_days" || key === "start_lag_days") return typeof value === "number" ? `${value} يوم` : null;
  return null;
}

function toggleIn<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export default function TemplateChangesModal({ templateBoardId, onClose }: { templateBoardId: string; onClose: () => void }) {
  const { changes, loading } = useTemplateChanges(templateBoardId, true);
  const { sync, syncing, dismiss, dismissing } = useTemplateChangeActions();

  const [pickedTasks, setPickedTasks] = useState<Set<string>>(new Set());
  const [pickedRemovals, setPickedRemovals] = useState<Set<string>>(new Set()); // copy ids
  const [pickedBoards, setPickedBoards] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<TemplateSyncReport | null>(null);
  const seeded = useRef(false);

  // everything starts selected, once the list arrives
  useEffect(() => {
    if (!changes || seeded.current) return;
    seeded.current = true;
    setPickedTasks(new Set(changes.tasks.map((t) => t.task_id)));
    setPickedRemovals(new Set(changes.removed.map((r) => r.copy_id)));
    setPickedBoards(
      new Set([...changes.tasks.flatMap((t) => t.boards.map((b) => b.board_id)), ...changes.removed.map((r) => r.board_id)]),
    );
  }, [changes]);

  const boards = useMemo(() => {
    const map = new Map<string, { id: string; name: string; tasks: number; skipped: number }>();
    for (const t of changes?.tasks ?? []) {
      for (const b of t.boards) {
        const entry = map.get(b.board_id) ?? { id: b.board_id, name: b.board_name, tasks: 0, skipped: 0 };
        if (pickedTasks.has(t.task_id)) {
          entry.tasks += 1;
          entry.skipped += b.skip.length;
        }
        map.set(b.board_id, entry);
      }
    }
    for (const r of changes?.removed ?? []) {
      if (!map.has(r.board_id)) map.set(r.board_id, { id: r.board_id, name: r.board_name, tasks: 0, skipped: 0 });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "ar"));
  }, [changes, pickedTasks]);

  const removedPicked = (changes?.removed ?? []).filter((r) => pickedRemovals.has(r.copy_id));
  // archived template tasks go by their task id, deleted ones by their note id
  const removalTaskIds = Array.from(new Set(removedPicked.map((r) => r.template_task_id).filter((id): id is string => !!id)));
  const removalNoteIds = removedPicked.map((r) => r.tombstone_id).filter((id): id is string => !!id);

  const taskIds = Array.from(new Set([...pickedTasks, ...removalTaskIds]));
  const canApply = !syncing && !dismissing && pickedBoards.size > 0 && (pickedTasks.size > 0 || removedPicked.length > 0);

  const apply = async () => {
    setError(null);
    try {
      const result = await sync({
        templateBoardId,
        taskIds,
        targetBoardIds: Array.from(pickedBoards),
        removedIds: removalNoteIds,
      });
      setReport(result);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const ignore = async () => {
    setError(null);
    try {
      await dismiss({ templateBoardId, taskIds: Array.from(new Set([...pickedTasks, ...removalTaskIds])), removedIds: removalNoteIds });
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const nothing = !loading && (changes?.tasks.length ?? 0) === 0 && (changes?.removed.length ?? 0) === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" dir="rtl">
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <RefreshCw className="h-4 w-4 text-primary" />
            تحديث اللوحات من القالب
          </h2>
          <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-100" aria-label="إغلاق">
            <X className="h-4 w-4" />
          </button>
        </div>

        {report ? (
          <div className="flex-1 space-y-3 overflow-y-auto p-6 text-sm text-gray-700">
            <p className="font-medium text-gray-900">
              {report.updated > 0 || report.removed > 0
                ? [
                    report.updated > 0 ? `حُدّثت ${report.updated} مهمة (${report.fields} حقل)` : null,
                    report.removed > 0 ? `أُرشفت ${report.removed} مهمة` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : "لم يتغيّر شيء في اللوحات"}
            </p>
            {report.skipped.length > 0 && (
              <div>
                <div className="mb-1 text-xs font-semibold text-amber-700">
                  لم تُطبَّق {report.skipped.length} تغييرات — غيّرها فريق اللوحة بنفسه أو تعذّر تطبيقها:
                </div>
                <ul className="max-h-48 space-y-0.5 overflow-y-auto text-xs text-gray-600">
                  {report.skipped.map((s, i) => (
                    <li key={i}>
                      {s.board_name ?? ""} — {s.field === "*" ? "اللوحة كلها" : (TEMPLATE_FIELD_LABELS[s.field] ?? s.field)}
                      {s.reason === "no_permission" ? " (ليست لديك صلاحية التعديل)" : s.reason === "error" ? " (تعذّر التطبيق)" : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end">
              <button onClick={onClose} className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-white">
                تم
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex justify-center p-10">
            <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
          </div>
        ) : nothing ? (
          <div className="flex flex-col items-center gap-3 p-10 text-sm text-gray-500">
            لا توجد تغييرات جديدة في القالب
            <button onClick={onClose} className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-white">
              تم
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-5 overflow-y-auto p-4">
              {(changes?.tasks.length ?? 0) > 0 && (
                <section>
                  <div className="mb-1.5 text-xs font-semibold text-gray-500">
                    مهام تغيّرت في القالب <span className="font-normal text-gray-400">({pickedTasks.size}/{changes?.tasks.length})</span>
                  </div>
                  <div className="space-y-1">
                    {changes?.tasks.map((t) => (
                      <label key={t.task_id} className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={pickedTasks.has(t.task_id)}
                          onChange={() => setPickedTasks((s) => toggleIn(s, t.task_id))}
                          className="mt-1 h-3.5 w-3.5"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-gray-800">{t.title}</span>
                          <span className="mt-0.5 flex flex-wrap gap-1">
                            {t.fields.map((f) => {
                              const before = shortValue(f.key, f.old);
                              const after = shortValue(f.key, f.new);
                              return (
                                <span key={f.key} className="inline-flex items-center gap-1 rounded-full bg-primary-superLight px-2 py-0.5 text-[11px] text-primary">
                                  {TEMPLATE_FIELD_LABELS[f.key] ?? f.key}
                                  {before !== null && after !== null && (
                                    <span className="inline-flex items-center gap-0.5 text-gray-500">
                                      {before}
                                      <ArrowLeft className="h-2.5 w-2.5" />
                                      <span className="font-medium text-gray-700">{after}</span>
                                    </span>
                                  )}
                                </span>
                              );
                            })}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </section>
              )}

              {(changes?.removed.length ?? 0) > 0 && (
                <section>
                  <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                    <Trash2 className="h-3.5 w-3.5" />
                    مهام حُذفت أو أُرشفت من القالب — تُرشف نسخها في اللوحات
                  </div>
                  <div className="space-y-0.5">
                    {changes?.removed.map((r) => (
                      <label key={r.copy_id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={pickedRemovals.has(r.copy_id)}
                          onChange={() => setPickedRemovals((s) => toggleIn(s, r.copy_id))}
                          className="h-3.5 w-3.5"
                        />
                        <span className="truncate text-gray-800">{r.title}</span>
                        <span className="shrink-0 truncate text-xs text-gray-400">· {r.board_name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-gray-400">المهام المكتملة أو الملغاة في اللوحة لا تُؤرشف أبداً.</p>
                </section>
              )}

              <section>
                <div className="mb-1.5 text-xs font-semibold text-gray-500">
                  اللوحات <span className="font-normal text-gray-400">({pickedBoards.size}/{boards.length})</span>
                </div>
                <div className="space-y-0.5">
                  {boards.map((b) => (
                    <label key={b.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={pickedBoards.has(b.id)}
                        onChange={() => setPickedBoards((s) => toggleIn(s, b.id))}
                        className="h-3.5 w-3.5"
                      />
                      <span className="truncate text-gray-700">{b.name}</span>
                      {b.skipped > 0 && (
                        <span className="shrink-0 text-[11px] text-amber-600">
                          {b.skipped} {b.skipped === 1 ? "حقل غيّره فريق اللوحة — سيبقى كما هو" : "حقول غيّرها فريق اللوحة — ستبقى كما هي"}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  يُحدَّث فقط ما لم يغيّره فريق اللوحة بنفسه. التواريخ تُعاد جدولتها على اللوحة تلقائياً.
                </p>
              </section>
            </div>

            <div className="flex flex-col gap-1.5 border-t border-gray-100 px-4 py-3">
              {error && <div className="rounded-md bg-red-50 px-2.5 py-1.5 text-xs text-red-600">{error}</div>}
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={ignore}
                  disabled={syncing || dismissing || (pickedTasks.size === 0 && removedPicked.length === 0)}
                  className="rounded-md px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                  title="لا تُرسل هذه التغييرات إلى اللوحات ولا تُعرض مرة أخرى"
                >
                  تجاهل المحدد
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={onClose} className="rounded-md px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50">
                    إلغاء
                  </button>
                  <button
                    onClick={apply}
                    disabled={!canApply}
                    className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
                  >
                    {syncing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    تطبيق على اللوحات
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
