import { useMemo, useState } from "react";
import { X, Loader2, Send, Search } from "lucide-react";
import {
  useBoardPickerOptions,
  useTemplateSyncActions,
  useTemplateSyncStatus,
  type PickerBoard,
  type TemplateSyncStatus,
} from "../../../hooks/tasks/useTemplateSync";
import { useAuth } from "../../../hooks/useAuth";
import { useAddTeamMember } from "../../../hooks/team/useTeamAssignments";
import { useRoleGaps } from "../../../hooks/tasks/useRoleGaps";
import RoleGapsSection, { resolveGapChoices, type GapChoice } from "./RoleGapsSection";

// Template push dialog, opened from the board's TemplateSyncBanner or its
// row-selection bar. On a template board it copies the chosen tasks onto
// the chosen boards; on a real board it first adds them to the board's
// template, then copies them onto the chosen boards (the board they came
// from already has them, so it's skipped). Boards that already use the
// template are listed first, then every other board, behind one search.

interface TaskLite {
  id: string;
  title: string;
  parent_task_id: string | null;
}

function localTodayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) return String((err as { message: unknown }).message);
  if (typeof err === "string") return err;
  return "تعذّرت الإضافة";
}

export default function PushToBoardsModal({
  boardId,
  isTemplate,
  status,
  tasks,
  initialTaskIds,
  onClose,
}: {
  boardId: string;
  isTemplate: boolean;
  status: TemplateSyncStatus;
  tasks: TaskLite[];
  initialTaskIds: string[];
  onClose: () => void;
}) {
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set(initialTaskIds));
  const [templateBoardId, setTemplateBoardId] = useState<string | undefined>(
    isTemplate ? boardId : status.templateBoards[0]?.id,
  );
  const [targetIds, setTargetIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [anchorDate, setAnchorDate] = useState(localTodayIso());
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  // A real board's "boards using the template" come from the template's
  // own status, not this board's.
  const { status: templateStatus } = useTemplateSyncStatus(isTemplate ? undefined : templateBoardId);
  const usingBoardIds = new Set((isTemplate ? status : templateStatus)?.usingBoardIds ?? []);
  const { boards, loading: boardsLoading } = useBoardPickerOptions(true);
  const { push, pushing } = useTemplateSyncActions();
  const { user } = useAuth();
  const addTeamMember = useAddTeamMember();
  const [gapChoices, setGapChoices] = useState<Record<string, GapChoice>>({});

  const taskById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);
  const shownTasks = initialTaskIds.map((id) => taskById.get(id)).filter((t): t is TaskLite => !!t);

  // Project roles only exist on template tasks, so only a push FROM a
  // template has roles to resolve. A push copies whole subtrees, so the
  // subtasks' roles count too.
  const copiedTaskIds = useMemo(() => {
    if (!isTemplate) return [];
    const childrenByParent = new Map<string, string[]>();
    for (const t of tasks) {
      if (!t.parent_task_id) continue;
      const list = childrenByParent.get(t.parent_task_id) ?? [];
      list.push(t.id);
      childrenByParent.set(t.parent_task_id, list);
    }
    const ids = new Set<string>();
    const walk = (id: string) => {
      if (ids.has(id)) return;
      ids.add(id);
      for (const child of childrenByParent.get(id) ?? []) walk(child);
    };
    for (const id of selectedTaskIds) walk(id);
    return Array.from(ids);
  }, [isTemplate, tasks, selectedTaskIds]);
  const roleGaps = useRoleGaps(copiedTaskIds, Array.from(targetIds));
  const gapResolution = resolveGapChoices(roleGaps.gaps, gapChoices);

  const term = search.trim();
  const matches = (b: PickerBoard) => !term || b.label.includes(term);
  const candidates = boards.filter((b) => b.id !== boardId);
  const usingBoards = candidates.filter((b) => usingBoardIds.has(b.id) && matches(b));
  const otherBoards = candidates.filter((b) => !usingBoardIds.has(b.id) && matches(b));

  const toggleIn = (set: Set<string>, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };

  // A template push needs somewhere to go; from a real board, adding to
  // the template alone is already useful.
  const canConfirm =
    !!templateBoardId &&
    selectedTaskIds.size > 0 &&
    (isTemplate ? targetIds.size > 0 : true) &&
    !pushing &&
    !addTeamMember.isPending &&
    !roleGaps.loading &&
    gapResolution.valid;

  const handleConfirm = async () => {
    if (!templateBoardId) return;
    setError(null);
    try {
      // "add to the role" choices first, so the push finds those people
      // in the role like any other holder
      for (const a of gapResolution.addToRole) {
        await addTeamMember.mutateAsync({
          projectId: a.projectId,
          personId: a.personId,
          projectRoleId: a.roleId,
          assignedBy: user?.id ?? null,
        });
      }
      const { created, addedToTemplate } = await push({
        fromBoardId: boardId,
        templateBoardId,
        taskIds: Array.from(selectedTaskIds),
        targetBoardIds: Array.from(targetIds),
        defaultAnchor: anchorDate,
        roleOverrides: gapResolution.overrides,
      });
      setResult(
        [addedToTemplate ? "أُضيفت المهام إلى القالب" : null, targetIds.size ? `أُنشئت ${created} مهمة في ${targetIds.size} لوحة` : null]
          .filter(Boolean)
          .join(" · "),
      );
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" dir="rtl">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <Send className="h-4 w-4 text-primary" />
            {isTemplate ? "إضافة المهام إلى لوحات" : "إضافة المهام إلى القالب واللوحات"}
          </h2>
          <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {result ? (
          <div className="flex flex-col items-center gap-3 p-8 text-sm text-gray-700">
            <span>{result}</span>
            <button onClick={onClose} className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-white">
              تم
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-5 overflow-y-auto p-4">
              <section>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">
                    المهام <span className="font-normal text-gray-400">({selectedTaskIds.size}/{shownTasks.length})</span>
                  </span>
                  <SelectAllLinks
                    onAll={() => setSelectedTaskIds(new Set(shownTasks.map((t) => t.id)))}
                    onNone={() => setSelectedTaskIds(new Set())}
                  />
                </div>
                <div className="space-y-0.5">
                  {shownTasks.map((t) => {
                    const parent = t.parent_task_id ? taskById.get(t.parent_task_id) : null;
                    return (
                      <label key={t.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={selectedTaskIds.has(t.id)}
                          onChange={() => setSelectedTaskIds((s) => toggleIn(s, t.id))}
                          className="h-3.5 w-3.5"
                        />
                        <span className="truncate text-gray-800">{t.title}</span>
                        {parent && <span className="shrink-0 truncate text-xs text-gray-400">↳ تحت {parent.title}</span>}
                      </label>
                    );
                  })}
                </div>
                <p className="mt-1 text-xs text-gray-400">تُنسخ المهمة مع مهامها الفرعية. اللوحة التي تحتوي المهمة بالفعل لا تُكرَّر فيها.</p>
              </section>

              {!isTemplate && (
                <section>
                  <div className="mb-1.5 text-xs font-semibold text-gray-500">القالب</div>
                  {status.templateBoards.length > 1 ? (
                    <select
                      value={templateBoardId}
                      onChange={(e) => {
                        setTemplateBoardId(e.target.value);
                        setTargetIds(new Set());
                      }}
                      className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none"
                    >
                      {status.templateBoards.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-sm text-gray-700">{status.templateBoards[0]?.name}</div>
                  )}
                  <p className="mt-1 text-xs text-gray-400">ستُضاف المهام إلى هذا القالب أولاً، ثم إلى اللوحات المختارة أدناه.</p>
                </section>
              )}

              <section>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-3 text-xs font-semibold text-gray-500">
                    <span>
                      اللوحات {targetIds.size > 0 && <span className="text-primary">({targetIds.size} محددة)</span>}
                    </span>
                    {/* acts on the boards currently listed, so a search narrows it */}
                    <SelectAllLinks
                      onAll={() =>
                        setTargetIds((s) => new Set([...s, ...usingBoards.map((b) => b.id), ...otherBoards.map((b) => b.id)]))
                      }
                      onNone={() => {
                        const listed = new Set([...usingBoards, ...otherBoards].map((b) => b.id));
                        setTargetIds((s) => new Set([...s].filter((id) => !listed.has(id))));
                      }}
                    />
                  </span>
                  <div className="flex items-center gap-1.5 rounded-md border border-gray-200 px-2 py-1">
                    <Search className="h-3.5 w-3.5 text-gray-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="بحث عن لوحة..."
                      className="w-44 bg-transparent text-sm outline-none"
                    />
                  </div>
                </div>

                {boardsLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
                  </div>
                ) : (
                  <>
                    <BoardGroup
                      title="لوحات تستخدم هذا القالب"
                      boards={usingBoards}
                      selected={targetIds}
                      onToggle={(id) => setTargetIds((s) => toggleIn(s, id))}
                      empty={term ? "لا نتائج" : "لا توجد لوحات تستخدم هذا القالب بعد"}
                    />
                    <BoardGroup
                      title="لوحات أخرى"
                      boards={otherBoards}
                      selected={targetIds}
                      onToggle={(id) => setTargetIds((s) => toggleIn(s, id))}
                      empty="لا نتائج"
                    />
                  </>
                )}
              </section>

              <RoleGapsSection
                gaps={roleGaps.gaps}
                filled={roleGaps.filled}
                loading={roleGaps.loading}
                choices={gapChoices}
                onChange={(key, choice) => setGapChoices((prev) => ({ ...prev, [key]: choice }))}
              />

              {targetIds.size > 0 && (
                <section className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500">تاريخ البدء (يوم 0)</span>
                  <input
                    type="date"
                    value={anchorDate}
                    onChange={(e) => setAnchorDate(e.target.value)}
                    className="rounded-md border border-gray-200 px-2 py-1 text-sm outline-none"
                  />
                  <span className="w-full text-xs text-gray-400">
                    يُستخدم للوحات التي لا يمكن معرفة تاريخ بدايتها من مهام القالب الموجودة فيها.
                  </span>
                </section>
              )}
            </div>

            <div className="flex flex-col gap-1.5 border-t border-gray-100 px-4 py-3">
              {error && <div className="rounded-md bg-red-50 px-2.5 py-1.5 text-xs text-red-600">{error}</div>}
              <div className="flex items-center justify-end gap-2">
                <button onClick={onClose} className="rounded-md px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50">
                  إلغاء
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!canConfirm}
                  className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
                >
                  {pushing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {isTemplate || targetIds.size > 0 ? "إضافة" : "إضافة إلى القالب فقط"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SelectAllLinks({ onAll, onNone }: { onAll: () => void; onNone: () => void }) {
  return (
    <span className="flex items-center gap-2 text-xs font-normal">
      <button onClick={onAll} className="text-primary hover:underline">
        تحديد الكل
      </button>
      <button onClick={onNone} className="text-gray-500 hover:underline">
        إلغاء التحديد
      </button>
    </span>
  );
}

function BoardGroup({
  title,
  boards,
  selected,
  onToggle,
  empty,
}: {
  title: string;
  boards: PickerBoard[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  empty: string;
}) {
  return (
    <div className="mb-3">
      <div className="mb-1 text-[11px] font-medium text-gray-400">{title}</div>
      {boards.length === 0 ? (
        <div className="px-2 py-1 text-xs text-gray-300">{empty}</div>
      ) : (
        <div className="max-h-48 space-y-0.5 overflow-y-auto">
          {boards.map((b) => (
            <label key={b.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-gray-50">
              <input type="checkbox" checked={selected.has(b.id)} onChange={() => onToggle(b.id)} className="h-3.5 w-3.5" />
              <span className="truncate text-gray-700">{b.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
