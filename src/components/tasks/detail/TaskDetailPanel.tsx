import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X, Loader2, ChevronLeft } from "lucide-react";
import { useTaskDetail } from "../../../hooks/tasks/useTaskDetail";
import StatusCell from "../board/StatusCell";
import PriorityCell from "../board/PriorityCell";
import AssigneeCell from "../board/AssigneeCell";
import LinkedRecordCard from "./LinkedRecordCard";
import RequirementsSection from "./RequirementsSection";
import DependenciesSection from "./DependenciesSection";
import ChecklistsSection from "./ChecklistsSection";
import SubtasksSection from "./SubtasksSection";
import RelationshipsSection from "./RelationshipsSection";
import AttachmentsSection from "./AttachmentsSection";
import ActivitySection from "./ActivitySection";

// =====================================================================
// D3 — Task detail (slide-over panel), build plan Part 7.
// =====================================================================
// Rendered as the nested route board/:boardId/task/:taskId (see
// TasksRoutes.tsx) — the parent route's element, TaskBoardPage, renders
// this via <Outlet/> as an absolutely-positioned overlay so the list
// stays mounted and visible behind it, never a full page navigation, per
// the build plan's explicit rule for this screen.

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-sm text-gray-500">{label}</span>
      <div>{children}</div>
    </div>
  );
}

export default function TaskDetailPanel() {
  const { boardId, taskId } = useParams<{ boardId: string; taskId: string }>();
  const navigate = useNavigate();
  const {
    data,
    loading,
    refetch,
    updateField,
    setAssignees,
    satisfyRequirement,
    addChecklist,
    addChecklistItem,
    toggleChecklistItem,
    addSubtask,
    addRelationship,
    removeRelationship,
  } = useTaskDetail(taskId);

  const [titleDraft, setTitleDraft] = useState<string | null>(null);
  const [descriptionDraft, setDescriptionDraft] = useState<string | null>(null);

  const close = () => navigate(`/tasks/board/${boardId}`);

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
                    onClick={() => navigate(`/tasks/board/${boardId}/task/${data.breadcrumb.parentId}`)}
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

            {/* description is JSON (build plan §4.7), not HTML — no rich-text
                editor exists in this repo yet, so this stores {text: string}
                as a placeholder shape rather than a real doc model. */}
            <textarea
              value={
                descriptionDraft ??
                ((data.task.description as { text?: string } | null)?.text ?? "")
              }
              onChange={(e) => setDescriptionDraft(e.target.value)}
              onBlur={() => {
                if (descriptionDraft !== null) {
                  updateField({ description: { text: descriptionDraft } });
                }
                setDescriptionDraft(null);
              }}
              placeholder="إضافة وصف..."
              rows={3}
              className="mt-2 w-full resize-none rounded-md border-none text-sm text-gray-600 outline-none placeholder:text-gray-300"
            />

            <div className="mt-3 divide-y divide-gray-50 border-y border-gray-100">
              <FieldRow label="الحالة">
                <StatusCell
                  statuses={data.statuses}
                  currentStatusId={data.task.status_id}
                  onChange={(statusId) => updateField({ status_id: statusId })}
                />
              </FieldRow>
              <FieldRow label="الأولوية">
                <PriorityCell
                  priority={data.task.priority}
                  onChange={(priority) => updateField({ priority })}
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
                />
              </FieldRow>
              <FieldRow label="تاريخ البدء">
                <input
                  type="date"
                  value={data.task.start_date?.slice(0, 10) ?? ""}
                  onChange={(e) => updateField({ start_date: e.target.value || null })}
                  className="rounded-md border border-gray-200 px-2 py-1 text-sm outline-none"
                />
              </FieldRow>
              <FieldRow label="تاريخ الاستحقاق">
                <input
                  type="date"
                  value={data.task.due_date?.slice(0, 10) ?? ""}
                  onChange={(e) => updateField({ due_date: e.target.value || null })}
                  className="rounded-md border border-gray-200 px-2 py-1 text-sm outline-none"
                />
              </FieldRow>
            </div>

            <Section title="السجل المرتبط" hidden={data.links.length === 0}>
              <LinkedRecordCard links={data.links} />
            </Section>

            <Section title="" hidden={data.requirements.length === 0}>
              <RequirementsSection
                requirements={data.requirements}
                onToggle={(id, satisfied) => satisfyRequirement({ requirementId: id, satisfied })}
              />
            </Section>

            <Section
              title="الاعتماديات"
              hidden={data.blocking.length === 0 && data.blockedByMe.length === 0}
            >
              <DependenciesSection blocking={data.blocking} blockedByMe={data.blockedByMe} />
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
                boardId={data.breadcrumb.boardId}
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

            <Section title="النشاط">
              <ActivitySection activity={data.activity} employeesById={data.employeesById} />
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
