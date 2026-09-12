import { useMemo, useState } from "react";
import { X, Loader2, Copy } from "lucide-react";
import {
  useZoneCloneBoards,
  useSourceZoneTasks,
  useCloneZoneApply,
  type CloneSourceTask,
} from "../../../hooks/tasks/useZoneClone";
import type { EmployeeLite } from "../../../hooks/tasks/useTaskBoard";

// =====================================================================
// D5 — Clone zone (build plan Part 7). Same layout shape as D4's
// TemplatePickerModal, but source is another zone's tasks instead of a
// template — see useZoneClone.ts's header for why the preview here has
// no per-node toggle below the root (copy_task_tree's task-side branch
// always copies a full subtree; only whole root branches can be
// opted out).
// =====================================================================

interface ZoneCloneModalProps {
  spaceId: string;
  currentBoardId: string;
  onClose: () => void;
  onApplied: () => void;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function initials(employee: EmployeeLite): string {
  const a = employee.first_name?.[0] ?? "";
  const b = employee.last_name?.[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

const AVATAR_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

function colorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// A PostgrestError extends Error, but some rejection shapes (a plain
// {message} object, a string) don't — catching those with `instanceof
// Error` silently threw away the real Postgres error text in favor of a
// generic fallback. This surfaces whatever text is actually there.
function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) return String((err as { message: unknown }).message);
  if (typeof err === "string") return err;
  return "تعذّر استنساخ المنطقة";
}

function dayOffset(date: string | null, from: string | null): string | null {
  if (!date || !from) return null;
  const days = Math.round(
    (new Date(date).getTime() - new Date(from).getTime()) / 86400000,
  );
  if (days === 0) return "نفس اليوم";
  return days > 0 ? `+${days}يوم` : `${days}يوم`;
}

export default function ZoneCloneModal({
  spaceId,
  currentBoardId,
  onClose,
  onApplied,
}: ZoneCloneModalProps) {
  const { boards, loading: loadingBoards } = useZoneCloneBoards(spaceId);
  const [sourceBoardId, setSourceBoardId] = useState<string | null>(null);
  const [targetBoardIds, setTargetBoardIds] = useState<Set<string>>(
    new Set([currentBoardId]),
  );
  const [anchorDate, setAnchorDate] = useState(todayIso());
  const [step, setStep] = useState<"pick" | "preview">("pick");
  const [excludedRootIds, setExcludedRootIds] = useState<Set<string>>(new Set());
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const { data: sourceData, loading: loadingSource } = useSourceZoneTasks(
    sourceBoardId ?? undefined,
  );
  const { apply, applying } = useCloneZoneApply();

  const sourceOptions = boards.filter((b) => b.id !== currentBoardId);

  const byParent = useMemo(() => {
    const map = new Map<string | null, CloneSourceTask[]>();
    for (const t of sourceData?.tasks ?? []) {
      const list = map.get(t.parent_task_id) ?? [];
      list.push(t);
      map.set(t.parent_task_id, list);
    }
    return map;
  }, [sourceData?.tasks]);
  const roots = byParent.get(null) ?? [];

  const countSelected = (nodes: CloneSourceTask[], parentId: string | null): number => {
    let count = 0;
    for (const n of nodes.filter((t) => t.parent_task_id === parentId)) {
      if (parentId === null && excludedRootIds.has(n.id)) continue;
      count += 1;
      count += countSelected(nodes, n.id);
    }
    return count;
  };
  const totalSelected = sourceData ? countSelected(sourceData.tasks, null) : 0;
  const targetCount = targetBoardIds.size;

  const toggleTarget = (id: string) => {
    setTargetBoardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleRoot = (id: string) => {
    setExcludedRootIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = async () => {
    setConfirmError(null);
    const selectedRootIds = roots.filter((r) => !excludedRootIds.has(r.id)).map((r) => r.id);
    try {
      await apply({
        selectedRootIds,
        targetBoardIds: Array.from(targetBoardIds),
        anchorDate,
      });
      onApplied();
    } catch (err) {
      setConfirmError(extractErrorMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" dir="rtl">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <Copy className="h-4.5 w-4.5 text-primary" />
            استنساخ منطقة
          </h2>
          <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {loadingBoards ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
          </div>
        ) : sourceOptions.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            لا توجد مناطق أخرى في هذه المساحة لاستنساخ مهامها بعد.
          </div>
        ) : step === "pick" ? (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-2 text-xs font-semibold text-gray-500">نسخ من منطقة</div>
              <div className="flex flex-wrap gap-1.5">
                {sourceOptions.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSourceBoardId(b.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      sourceBoardId === b.id
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              {sourceBoardId && (
                <>
                  <div className="mb-2 mt-5 text-xs font-semibold text-gray-500">
                    تطبيق على (المناطق/اللوحات)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {boards
                      .filter((b) => b.id !== sourceBoardId)
                      .map((b) => {
                        const checked = targetBoardIds.has(b.id);
                        return (
                          <button
                            key={b.id}
                            onClick={() => toggleTarget(b.id)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                              checked
                                ? "bg-primary text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {b.label}
                          </button>
                        );
                      })}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500">تاريخ البداية الجديد</span>
                    <input
                      type="date"
                      value={anchorDate}
                      onChange={(e) => setAnchorDate(e.target.value)}
                      className="rounded-md border border-gray-200 px-2 py-1 text-sm outline-none"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
              <span className="text-xs text-gray-400">
                {sourceBoardId ? `${sourceData?.tasks.length ?? 0} مهمة في المصدر` : "اختر منطقة المصدر"}
              </span>
              <button
                disabled={!sourceBoardId || targetBoardIds.size === 0 || loadingSource}
                onClick={() => setStep("preview")}
                className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
              >
                متابعة
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              {loadingSource ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
                </div>
              ) : roots.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">
                  لا توجد مهام في هذه المنطقة لاستنساخها
                </div>
              ) : (
                roots.map((root) => (
                  <CloneNode
                    key={root.id}
                    node={root}
                    isRoot
                    depth={0}
                    ancestorExcluded={false}
                    rootStartDate={root.start_date}
                    byParent={byParent}
                    excludedRootIds={excludedRootIds}
                    onToggleRoot={toggleRoot}
                    employeesById={sourceData?.employeesById ?? new Map()}
                    assigneesByTask={sourceData?.assigneesByTask ?? new Map()}
                    departmentNamesById={sourceData?.departmentNamesById ?? new Map()}
                  />
                ))
              )}
            </div>

            <div className="flex flex-col gap-1.5 border-t border-gray-100 px-4 py-3">
              {confirmError && (
                <div className="rounded-md bg-red-50 px-2.5 py-1.5 text-xs text-red-600">{confirmError}</div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {totalSelected} مهمة × {targetCount} منطقة = {totalSelected * targetCount}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStep("pick")}
                    className="rounded-md px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50"
                  >
                    رجوع
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={applying || totalSelected === 0}
                    className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
                  >
                    {applying && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    استنساخ المهام
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

function CloneNode({
  node,
  isRoot,
  depth,
  ancestorExcluded,
  rootStartDate,
  byParent,
  excludedRootIds,
  onToggleRoot,
  employeesById,
  assigneesByTask,
  departmentNamesById,
}: {
  node: CloneSourceTask;
  isRoot: boolean;
  depth: number;
  ancestorExcluded: boolean;
  rootStartDate: string | null;
  byParent: Map<string | null, CloneSourceTask[]>;
  excludedRootIds: Set<string>;
  onToggleRoot: (id: string) => void;
  employeesById: Map<string, EmployeeLite>;
  assigneesByTask: Map<string, string[]>;
  departmentNamesById: Map<string, string>;
}) {
  const checked = isRoot ? !excludedRootIds.has(node.id) : true;
  const effectivelyChecked = checked && !ancestorExcluded;
  const disabled = ancestorExcluded || !isRoot; // only root nodes are togglable
  const children = byParent.get(node.id) ?? [];
  const department = node.department_id ? departmentNamesById.get(node.department_id) : null;
  const offset = dayOffset(node.due_date ?? node.start_date, rootStartDate);
  const assignees = assigneesByTask.get(node.id) ?? [];

  return (
    <>
      <div
        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
          ancestorExcluded ? "opacity-40" : ""
        }`}
        style={{ paddingRight: 8 + depth * 20 }}
      >
        <input
          type="checkbox"
          checked={effectivelyChecked}
          disabled={disabled}
          onChange={() => isRoot && onToggleRoot(node.id)}
          className="h-3.5 w-3.5"
        />
        <span className="flex-1 truncate text-gray-700">{node.title}</span>
        {department && <span className="shrink-0 text-xs text-gray-400">{department}</span>}
        {offset && (
          <span className="shrink-0 rounded-full bg-gray-100 px-1.5 text-xs text-gray-500">{offset}</span>
        )}
        {assignees.length > 0 && (
          <div className="flex shrink-0 items-center -space-x-1.5 rtl:space-x-reverse">
            {assignees.slice(0, 3).map((id) => {
              const employee = employeesById.get(id);
              return (
                <span
                  key={id}
                  className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-[9px] font-semibold text-white"
                  style={{ background: colorFor(id) }}
                  title={employee ? `${employee.first_name} ${employee.last_name ?? ""}` : ""}
                >
                  {employee ? initials(employee) : "?"}
                </span>
              );
            })}
          </div>
        )}
      </div>
      {children.map((child) => (
        <CloneNode
          key={child.id}
          node={child}
          isRoot={false}
          depth={depth + 1}
          ancestorExcluded={ancestorExcluded || !effectivelyChecked}
          rootStartDate={rootStartDate}
          byParent={byParent}
          excludedRootIds={excludedRootIds}
          onToggleRoot={onToggleRoot}
          employeesById={employeesById}
          assigneesByTask={assigneesByTask}
          departmentNamesById={departmentNamesById}
        />
      ))}
    </>
  );
}
