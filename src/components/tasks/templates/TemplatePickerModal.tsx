import { useMemo, useState } from "react";
import { X, Loader2, FileStack } from "lucide-react";
import {
  useTemplatePicker,
  useTemplateSelection,
  type TemplateTask,
} from "../../../hooks/tasks/useTemplatePicker";
import { useTemplateMode } from "../TemplateModeContext";
import { dateToDayOffset, dayOffsetLabel, dayOffsetToDate } from "../board/templateDates";
import { useAuth } from "../../../hooks/useAuth";
import { useAddTeamMember } from "../../../hooks/team/useTeamAssignments";
import { useRoleGaps } from "../../../hooks/tasks/useRoleGaps";
import RoleGapsSection, { resolveGapChoices, type GapChoice } from "./RoleGapsSection";

// =====================================================================
// D4 — Template picker (build plan Part 7). See useTemplatePicker.ts's
// header comment for how selection maps onto apply_template_board() —
// this file is presentation + the merged-preview tree only.
// =====================================================================

interface TemplatePickerModalProps {
  spaceId: string;
  currentBoardId: string;
  onClose: () => void;
  onApplied: () => void;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// A PostgrestError extends Error, but some rejection shapes (a plain
// {message} object, a string) don't — catching those with `instanceof
// Error` silently threw away the real Postgres error text in favor of a
// generic fallback. This surfaces whatever text is actually there.
function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) return String((err as { message: unknown }).message);
  if (typeof err === "string") return err;
  return "تعذّر تطبيق القالب";
}

export default function TemplatePickerModal({
  spaceId,
  currentBoardId,
  onClose,
  onApplied,
}: TemplatePickerModalProps) {
  // Opened on a template board: the template itself is the only target,
  // and the anchor is a "Day N" rather than a calendar date.
  const isTemplate = useTemplateMode();
  const { data, loading, apply, applying } = useTemplatePicker(spaceId, currentBoardId, isTemplate);
  const selection = useTemplateSelection();
  const [targetBoardIds, setTargetBoardIds] = useState<Set<string>>(
    new Set([currentBoardId]),
  );
  const [anchorDate, setAnchorDate] = useState(isTemplate ? dayOffsetToDate(0) : todayIso());
  const [step, setStep] = useState<"pick" | "preview">("pick");
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [gapChoices, setGapChoices] = useState<Record<string, GapChoice>>({});
  const { user } = useAuth();
  const addTeamMember = useAddTeamMember();

  const selectedTemplates = useMemo(
    () => (data?.templates ?? []).filter((t) => selection.selectedTemplateIds.has(t.id)),
    [data, selection.selectedTemplateIds],
  );

  const toggleTarget = (id: string) => {
    setTargetBoardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Effective inclusion + counting, shared by rendering and the footer
  // tally — a node counts only if neither it nor any ancestor is excluded
  // (the same rule apply_template_board()'s tree walk applies).
  const countTemplate = (templateId: string): number => {
    const nodes = data?.templateTasksByTemplate.get(templateId) ?? [];
    const byParent = groupByParent(nodes);
    let count = 0;
    const walk = (node: TemplateTask) => {
      if (selection.isExcluded(node.id)) return;
      count++;
      for (const child of byParent.get(node.id) ?? []) walk(child);
    };
    for (const root of byParent.get(null) ?? []) walk(root);
    return count;
  };

  // The template tasks that will actually be copied — same walk as above.
  const includedTaskIds = useMemo(() => {
    const ids: string[] = [];
    for (const t of selectedTemplates) {
      const byParent = groupByParent(data?.templateTasksByTemplate.get(t.id) ?? []);
      const walk = (node: TemplateTask) => {
        if (selection.isExcluded(node.id)) return;
        ids.push(node.id);
        for (const child of byParent.get(node.id) ?? []) walk(child);
      };
      for (const root of byParent.get(null) ?? []) walk(root);
    }
    return ids;
  }, [selectedTemplates, data, selection]);

  // Project roles on those tasks vs. who holds them on each target's
  // project. Into a template, roles stay roles — nothing to resolve.
  const roleGaps = useRoleGaps(step === "preview" && !isTemplate ? includedTaskIds : [], Array.from(targetBoardIds));
  const gapResolution = resolveGapChoices(roleGaps.gaps, gapChoices);

  const totalTasksPerZone = selectedTemplates.reduce((sum, t) => sum + countTemplate(t.id), 0);
  const zoneCount = targetBoardIds.size;
  const uniqueColumnNames = Array.from(
    new Set(selectedTemplates.flatMap((t) => data?.columnNamesByTemplate.get(t.id) ?? [])),
  );

  const handleConfirm = async () => {
    setConfirmError(null);
    try {
      // "add to the role" choices are real team changes, made first so the
      // copy finds those people in the role like any other holder
      for (const a of gapResolution.addToRole) {
        await addTeamMember.mutateAsync({
          projectId: a.projectId,
          personId: a.personId,
          projectRoleId: a.roleId,
          assignedBy: user?.id ?? null,
        });
      }
      await apply({
        templateIds: selectedTemplates.map((t) => t.id),
        excludedIds: Array.from(selection.excludedIds),
        targetBoardIds: Array.from(targetBoardIds),
        anchorDate,
        roleOverrides: gapResolution.overrides,
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
            <FileStack className="h-4.5 w-4.5 text-primary" />
            استخدام قالب
          </h2>
          <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
          </div>
        ) : !data || data.templates.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            لا توجد قوالب متاحة بعد. القوالب تُضاف من شاشة القوالب.
          </div>
        ) : step === "pick" ? (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-2 text-xs font-semibold text-gray-500">القوالب</div>
              <div className="grid grid-cols-2 gap-2">
                {data.templates.map((t) => {
                  const checked = selection.selectedTemplateIds.has(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => selection.toggleTemplate(t.id)}
                      className={`rounded-lg border p-3 text-right transition-colors ${
                        checked ? "border-primary bg-primary-superLight" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-800">{t.name}</span>
                        <input type="checkbox" checked={checked} readOnly className="h-3.5 w-3.5" />
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        {data.templateTasksByTemplate.get(t.id)?.length ?? 0} مهمة
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedTemplates.length > 0 && (
                <>
                  <div className="mb-2 mt-5 text-xs font-semibold text-gray-500">
                    تطبيق على (المناطق/اللوحات)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {data.targetBoards.map((b) => {
                      const checked = targetBoardIds.has(b.id);
                      return (
                        <button
                          key={b.id}
                          onClick={() => toggleTarget(b.id)}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                            checked ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {b.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    {isTemplate ? (
                      <>
                        <span className="text-xs font-semibold text-gray-500">يبدأ القالب من يوم</span>
                        <input
                          type="number"
                          step={1}
                          value={dateToDayOffset(anchorDate)}
                          onChange={(e) => setAnchorDate(dayOffsetToDate(Number(e.target.value) || 0))}
                          className="w-20 rounded-md border border-gray-200 px-2 py-1 text-sm outline-none"
                        />
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-semibold text-gray-500">تاريخ البدء (يوم 0)</span>
                        <input
                          type="date"
                          value={anchorDate}
                          onChange={(e) => setAnchorDate(e.target.value)}
                          className="rounded-md border border-gray-200 px-2 py-1 text-sm outline-none"
                        />
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
              <span className="text-xs text-gray-400">
                {selectedTemplates.length} قالب محدد
              </span>
              <button
                disabled={selectedTemplates.length === 0 || targetBoardIds.size === 0}
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
              {selectedTemplates.map((t) => (
                <TemplatePreviewTree
                  key={t.id}
                  templateName={t.name}
                  nodes={data.templateTasksByTemplate.get(t.id) ?? []}
                  departmentNamesById={data.departmentNamesById}
                  assigneeCountByTask={data.assigneeCountByTask}
                  selection={selection}
                />
              ))}

              <div className="mt-4">
                <RoleGapsSection
                  gaps={roleGaps.gaps}
                  filled={roleGaps.filled}
                  loading={roleGaps.loading}
                  choices={gapChoices}
                  onChange={(key, choice) => setGapChoices((prev) => ({ ...prev, [key]: choice }))}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 border-t border-gray-100 px-4 py-3">
              {confirmError && (
                <div className="rounded-md bg-red-50 px-2.5 py-1.5 text-xs text-red-600">{confirmError}</div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {totalTasksPerZone} مهمة × {zoneCount} منطقة = {totalTasksPerZone * zoneCount}
                  {uniqueColumnNames.length > 0 && ` · دمج ${uniqueColumnNames.length} حقل`}
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
                    disabled={
                      applying ||
                      addTeamMember.isPending ||
                      totalTasksPerZone === 0 ||
                      roleGaps.loading ||
                      !gapResolution.valid
                    }
                    className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
                  >
                    {applying && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    إنشاء المهام
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

function groupByParent(nodes: TemplateTask[]): Map<string | null, TemplateTask[]> {
  const map = new Map<string | null, TemplateTask[]>();
  for (const n of nodes) {
    const list = map.get(n.parent_task_id) ?? [];
    list.push(n);
    map.set(n.parent_task_id, list);
  }
  return map;
}

function TemplatePreviewTree({
  templateName,
  nodes,
  departmentNamesById,
  assigneeCountByTask,
  selection,
}: {
  templateName: string;
  nodes: TemplateTask[];
  departmentNamesById: Map<string, string>;
  assigneeCountByTask: Map<string, number>;
  selection: ReturnType<typeof useTemplateSelection>;
}) {
  const byParent = useMemo(() => groupByParent(nodes), [nodes]);
  const roots = byParent.get(null) ?? [];

  return (
    <div className="mb-3">
      {roots.map((root) => (
        <PreviewNode
          key={root.id}
          node={root}
          isRoot
          depth={0}
          ancestorExcluded={false}
          templateName={templateName}
          byParent={byParent}
          departmentNamesById={departmentNamesById}
          assigneeCountByTask={assigneeCountByTask}
          selection={selection}
        />
      ))}
    </div>
  );
}

function offsetLabel(node: TemplateTask): string | null {
  const date = node.start_date ?? node.due_date;
  return date ? dayOffsetLabel(dateToDayOffset(date)) : null;
}

function PreviewNode({
  node,
  isRoot,
  depth,
  ancestorExcluded,
  templateName,
  byParent,
  departmentNamesById,
  assigneeCountByTask,
  selection,
}: {
  node: TemplateTask;
  isRoot: boolean;
  depth: number;
  ancestorExcluded: boolean;
  templateName: string;
  byParent: Map<string | null, TemplateTask[]>;
  departmentNamesById: Map<string, string>;
  assigneeCountByTask: Map<string, number>;
  selection: ReturnType<typeof useTemplateSelection>;
}) {
  const effectivelyChecked = !selection.isExcluded(node.id) && !ancestorExcluded;
  const disabled = ancestorExcluded;
  const children = byParent.get(node.id) ?? [];

  const department = node.department_id ? departmentNamesById.get(node.department_id) : null;
  const offset = offsetLabel(node);
  const assigneeCount = assigneeCountByTask.get(node.id) ?? 0;

  return (
    <>
      <div
        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${disabled ? "opacity-40" : ""}`}
        style={{ paddingRight: 8 + depth * 20 }}
      >
        <input
          type="checkbox"
          checked={effectivelyChecked}
          disabled={disabled}
          onChange={() => !disabled && selection.toggleNode(node.id)}
          className="h-3.5 w-3.5"
        />
        <span className="flex-1 truncate text-gray-700">{node.title}</span>
        {department && <span className="shrink-0 text-xs text-gray-400">{department}</span>}
        {assigneeCount > 0 && <span className="shrink-0 text-xs text-gray-400">{assigneeCount} مسؤول</span>}
        {offset && (
          <span className="shrink-0 rounded-full bg-gray-100 px-1.5 text-xs text-gray-500">{offset}</span>
        )}
        {isRoot && (
          <span className="shrink-0 rounded-full bg-blue-50 px-1.5 text-xs text-blue-500">{templateName}</span>
        )}
      </div>
      {children.map((child) => (
        <PreviewNode
          key={child.id}
          node={child}
          isRoot={false}
          depth={depth + 1}
          ancestorExcluded={ancestorExcluded || !effectivelyChecked}
          templateName={templateName}
          byParent={byParent}
          departmentNamesById={departmentNamesById}
          assigneeCountByTask={assigneeCountByTask}
          selection={selection}
        />
      ))}
    </>
  );
}
