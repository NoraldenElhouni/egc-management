import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { X, Loader2, ChevronLeft, Trash2 } from "lucide-react";
import { useTaskDetail } from "../../../hooks/tasks/useTaskDetail";
import StatusCell from "../board/StatusCell";
import PriorityCell from "../board/PriorityCell";
import AssigneeCell from "../board/AssigneeCell";
import StartDateCell from "../board/StartDateCell";
import DateCell from "../board/DateCell";
import CustomFieldCell from "../board/CustomFieldCell";
import LinkedRecordCard from "./LinkedRecordCard";
import LinkRecordPicker from "./LinkRecordPicker";
import RequirementsSection from "./RequirementsSection";
import DependenciesSection from "./DependenciesSection";
import ChecklistsSection from "./ChecklistsSection";
import SubtasksSection from "./SubtasksSection";
import RelationshipsSection from "./RelationshipsSection";
import AttachmentsSection from "./AttachmentsSection";
import CommentsSection from "./CommentsSection";
import CommentComposer from "./CommentComposer";
import ActivitySection from "./ActivitySection";
import TagPicker from "./TagPicker";
import RecurrenceSection from "./RecurrenceSection";
import MentionTextarea from "./MentionTextarea";

// =====================================================================
// D3 — Task detail (slide-over panel), build plan Part 7.
// =====================================================================
// Rendered as a nested task/:taskId route under board/:boardId, D6's
// department/:departmentId, or D7's my-work (see TasksRoutes.tsx) — the
// parent route's element renders this via <Outlet/> as an
// absolutely-positioned overlay so the list stays mounted and visible
// behind it, never a full page navigation, per the build plan's explicit
// rule for this screen. Since three different parents can host it, this
// component never hardcodes "/tasks/board/..." — basePath below strips
// the trailing "/task/:taskId" off the current URL, so close() and every
// internal link (breadcrumb parent, subtasks) return to whichever list
// actually opened this panel.

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-sm text-gray-500">{label}</span>
      <div>{children}</div>
    </div>
  );
}

export default function TaskDetailPanel() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.replace(/\/task\/[^/]+$/, "");
  const {
    data,
    loading,
    refetch,
    updateField,
    setAssignees,
    satisfyRequirement,
    setCustomValue,
    addRequirement,
    deleteRequirement,
    addChecklist,
    addChecklistItem,
    toggleChecklistItem,
    addSubtask,
    addRelationship,
    removeRelationship,
    addDependency,
    removeDependency,
    syncMentions,
    addLink,
    removeLink,
    addComment,
    editComment,
    deleteComment,
    toggleCommentResolved,
    toggleTag,
    deleteTask,
    deletingTask,
  } = useTaskDetail(taskId);

  const [titleDraft, setTitleDraft] = useState<string | null>(null);
  const [descriptionDraft, setDescriptionDraft] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!data) return;
    const warning = data.subtasks.length
      ? `حذف "${data.task.title}" و${data.subtasks.length} مهمة فرعية تحتها نهائياً؟ لا يمكن التراجع عن هذا.`
      : `حذف "${data.task.title}" نهائياً؟ لا يمكن التراجع عن هذا.`;
    if (!confirm(warning)) return;
    await deleteTask();
    navigate(basePath);
  };

  const close = () => navigate(basePath);

  return (
    <div className="fixed inset-0 z-40 flex justify-end" dir="rtl">
      <button
        aria-label="إغلاق"
        onClick={close}
        className="absolute inset-0 bg-black/20"
      />

      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          {data ? (
            <nav className="flex items-center gap-1 truncate text-xs text-gray-400">
              {data.breadcrumb.projectName && <span>{data.breadcrumb.projectName}</span>}
              {data.breadcrumb.zoneName && (
                <>
                  <ChevronLeft className="h-3 w-3" />
                  <span>{data.breadcrumb.zoneName}</span>
                </>
              )}
              {data.breadcrumb.parentTitle && (
                <>
                  <ChevronLeft className="h-3 w-3" />
                  <button
                    onClick={() => navigate(`${basePath}/task/${data.breadcrumb.parentId}`)}
                    className="truncate hover:text-gray-600 hover:underline"
                  >
                    {data.breadcrumb.parentTitle}
                  </button>
                </>
              )}
            </nav>
          ) : (
            <span />
          )}
          <button onClick={close} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {loading || !data ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <input
              value={titleDraft ?? data.task.title}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={() => {
                const title = (titleDraft ?? "").trim();
                if (title && title !== data.task.title) updateField({ title });
                setTitleDraft(null);
              }}
              className="w-full border-none text-lg font-semibold text-gray-900 outline-none"
            />

            <div className="mt-1.5">
              <TagPicker
                allTags={data.allTags}
                tagIds={data.tagIds}
                onToggle={(tagId, attached) => toggleTag({ tagId, attached })}
              />
            </div>

            {/* description is JSON (build plan §4.7), not HTML — no rich-text
                editor exists in this repo yet, so this stores {text: string}
                as a placeholder shape rather than a real doc model. Typing
                "@task title" opens a search dropdown (MentionTextarea) —
                the token it inserts renders as raw text here (no view/edit
                split for this field) but still creates the reference
                relationship on save, per build plan §4.13. */}
            <MentionTextarea
              value={
                descriptionDraft ??
                ((data.task.description as { text?: string } | null)?.text ?? "")
              }
              onChange={setDescriptionDraft}
              excludeTaskId={data.task.id}
              onBlur={() => {
                if (descriptionDraft !== null) {
                  updateField({ description: { text: descriptionDraft } });
                  syncMentions(descriptionDraft);
                }
                setDescriptionDraft(null);
              }}
              placeholder="إضافة وصف..."
              rows={3}
              className="mt-2 w-full resize-none rounded-md border-none text-sm text-gray-600 outline-none placeholder:text-gray-300"
            />

            <Section title="التعليقات">
              <CommentsSection
                comments={data.comments}
                employeesById={data.employeesById}
                excludeTaskId={data.task.id}
                onEditComment={async (id, text) => {
                  await editComment({ id, text });
                  syncMentions(text);
                }}
                onDeleteComment={deleteComment}
                onToggleResolved={(id, resolved) => toggleCommentResolved({ id, resolved })}
                onNavigateToTask={(id) => navigate(`${basePath}/task/${id}`)}
              />
            </Section>

            <div className="mt-3 divide-y divide-gray-50 border-y border-gray-100">
              <FieldRow label="الحالة">
                <StatusCell
                  statuses={data.statuses}
                  currentStatusId={data.task.status_id}
                  onChange={(statusId) => updateField({ status_id: statusId })}
                  align="left"
                />
              </FieldRow>
              <FieldRow label="الأولوية">
                <PriorityCell
                  priority={data.task.priority}
                  onChange={(priority) => updateField({ priority })}
                  align="left"
                />
              </FieldRow>
              <FieldRow label="القسم">
                <select
                  value={data.task.department_id ?? ""}
                  onChange={(e) => updateField({ department_id: e.target.value || null })}
                  className="rounded-md border border-gray-200 px-2 py-1 text-sm outline-none"
                >
                  <option value="">—</option>
                  {data.allDepartments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </FieldRow>
              <FieldRow label="التخصص">
                <select
                  value={data.task.specialization_id ?? ""}
                  onChange={(e) => updateField({ specialization_id: e.target.value || null })}
                  className="rounded-md border border-gray-200 px-2 py-1 text-sm outline-none"
                >
                  <option value="">—</option>
                  {data.allSpecializations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </FieldRow>
              <FieldRow label="المسؤولون">
                <AssigneeCell
                  assigneeIds={data.assigneeIds}
                  employeesById={data.employeesById}
                  allEmployees={data.employees}
                  onChange={(userIds) => setAssignees(userIds)}
                  align="left"
                />
              </FieldRow>
              <FieldRow label="تاريخ البدء">
                <StartDateCell
                  startDate={data.task.start_date}
                  onChange={(date) => updateField({ start_date: date })}
                  align="left"
                />
              </FieldRow>
              <FieldRow label="تاريخ الاستحقاق">
                <DateCell
                  dueDate={data.task.due_date}
                  isOverdue={data.task.is_overdue}
                  onChange={(date) => updateField({ due_date: date })}
                  align="left"
                />
              </FieldRow>
              {/* The board's attached custom fields (D2's "+" column
                  editor) previously had no home in this panel — only the
                  dense board row could show or edit them. */}
              {data.customColumns.map((col) => (
                <FieldRow key={col.boardColumnId} label={col.name_ar}>
                  <CustomFieldCell
                    column={col}
                    value={data.customValues.get(col.fieldDefinitionId)}
                    employeesById={data.employeesById}
                    allEmployees={data.employees}
                    onChange={(value) => setCustomValue({ fieldDefinitionId: col.fieldDefinitionId, value })}
                    align="left"
                  />
                </FieldRow>
              ))}
            </div>

            <Section title="السجل المرتبط">
              <div className="space-y-1.5">
                <LinkedRecordCard links={data.links} onRemove={removeLink} />
                <LinkRecordPicker
                  projectId={data.task.project_id}
                  onAdd={(input) => addLink({ recordType: input.recordType, recordId: input.recordId, linkMode: input.linkMode })}
                />
              </div>
            </Section>

            <Section title="">
              <RequirementsSection
                requirements={data.requirements}
                onToggle={(id, satisfied) => satisfyRequirement({ requirementId: id, satisfied })}
                onAdd={addRequirement}
                onDelete={deleteRequirement}
              />
            </Section>

            <Section title="الاعتماديات">
              <DependenciesSection
                taskId={data.task.id}
                spaceId={data.breadcrumb.spaceId}
                blocking={data.blocking}
                blockedByMe={data.blockedByMe}
                onAdd={(relatedTaskId, direction) => addDependency({ relatedTaskId, direction })}
                onRemove={(dependencyId) => removeDependency(dependencyId)}
              />
            </Section>

            <Section title="الروابط">
              <RelationshipsSection
                taskId={data.task.id}
                relationships={data.relationships}
                onAdd={(relatedTaskId, type) => addRelationship({ relatedTaskId, type })}
                onRemove={(id) => removeRelationship(id)}
              />
            </Section>

            <Section title="قوائم التحقق">
              <ChecklistsSection
                checklists={data.checklists}
                onAddChecklist={(name) => addChecklist(name)}
                onAddItem={(checklistId, content) => addChecklistItem({ checklistId, content })}
                onToggleItem={(itemId, checked) => toggleChecklistItem({ itemId, checked })}
              />
            </Section>

            <Section title="المهام الفرعية">
              <SubtasksSection
                basePath={basePath}
                subtasks={data.subtasks}
                onAdd={(title) => addSubtask(title)}
              />
            </Section>

            <Section title="المرفقات">
              <AttachmentsSection
                taskId={data.task.id}
                attachments={data.attachments}
                onUploaded={() => refetch()}
              />
            </Section>

            <Section title="إضافة تعليق">
              <CommentComposer
                excludeTaskId={data.task.id}
                onAddComment={async (text) => {
                  await addComment({ text });
                  syncMentions(text);
                }}
              />
            </Section>

            <Section title="النشاط">
              <ActivitySection activity={data.activity} employeesById={data.employeesById} />
            </Section>

            <Section title="التكرار">
              <RecurrenceSection taskId={data.task.id} boardId={data.breadcrumb.boardId} />
            </Section>

            <Section title="منطقة الخطر">
              <div className="rounded-md border border-red-100 bg-red-50/50 p-3">
                <button
                  onClick={handleDelete}
                  disabled={deletingTask}
                  className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  {deletingTask ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  حذف المهمة نهائياً
                </button>
                {data.subtasks.length > 0 && (
                  <p className="mt-1 text-xs text-red-400">
                    سيتم حذف {data.subtasks.length} مهمة فرعية تحتها أيضاً.
                  </p>
                )}
              </div>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  hidden,
  children,
}: {
  title: string;
  hidden?: boolean;
  children: React.ReactNode;
}) {
  if (hidden) return null;
  return (
    <div className="mt-4">
      {title && <div className="mb-1.5 text-xs font-semibold text-gray-500">{title}</div>}
      {children}
    </div>
  );
}
