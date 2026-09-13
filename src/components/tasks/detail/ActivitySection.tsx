import { useState } from "react";
import { History, MessageSquare, Check, Pencil, Trash2, X } from "lucide-react";
import type { Activity, Comment } from "../../../hooks/tasks/useTaskDetail";
import type { EmployeeLite } from "../../../hooks/tasks/useTaskBoard";
import { useAuth } from "../../../hooks/useAuth";
import MentionTextarea from "./MentionTextarea";
import MentionText from "./MentionText";

const ACTION_LABELS: Record<string, string> = {
  created: "أنشأ المهمة",
  status_changed: "غيّر الحالة",
  assignee_added: "أضاف مسؤولاً",
  assignee_removed: "أزال مسؤولاً",
  field_changed: "غيّر حقلاً",
  moved: "نقل المهمة",
  due_date_changed: "غيّر تاريخ الاستحقاق",
  dependency_added: "أضاف اعتماداً",
  requirement_satisfied: "استوفى متطلباً",
  link_added: "أضاف رابط سجل",
  task_assignee: "غيّر المسؤولين",
};

// Comments and activity, interleaved by timestamp (clickup-task-ui skill,
// build plan §4.17's own note on why they're two tables but one feed).
// Activity rows are written entirely by triggers (P5) and never editable
// here; comments are the only thing a person actually authors, so only
// they get edit/delete (own comment only) and a resolve toggle.

type FeedItem =
  | { kind: "activity"; at: string; data: Activity }
  | { kind: "comment"; at: string; data: Comment };

export default function ActivitySection({
  activity,
  comments,
  employeesById,
  excludeTaskId,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onToggleResolved,
  onNavigateToTask,
}: {
  activity: Activity[];
  comments: Comment[];
  employeesById: Map<string, EmployeeLite>;
  excludeTaskId: string;
  onAddComment: (text: string) => void;
  onEditComment: (id: string, text: string) => void;
  onDeleteComment: (id: string) => void;
  onToggleResolved: (id: string, resolved: boolean) => void;
  onNavigateToTask: (taskId: string) => void;
}) {
  const { user } = useAuth();
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const feed: FeedItem[] = [
    ...activity.map((a): FeedItem => ({ kind: "activity", at: a.created_at, data: a })),
    ...comments.map((c): FeedItem => ({ kind: "comment", at: c.created_at, data: c })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const nameOf = (userId: string | null) => {
    if (!userId) return "النظام";
    const e = employeesById.get(userId);
    return e ? `${e.first_name} ${e.last_name ?? ""}`.trim() : "مستخدم";
  };

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onAddComment(text);
    setDraft("");
  };

  const submitEdit = (id: string) => {
    const text = editDraft.trim();
    if (text) onEditComment(id, text);
    setEditingId(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <MessageSquare className="mt-1.5 h-3.5 w-3.5 shrink-0 text-gray-300" />
        <div className="flex-1">
          <MentionTextarea
            value={draft}
            onChange={setDraft}
            excludeTaskId={excludeTaskId}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
            placeholder="اكتب تعليقاً... (Ctrl+Enter للإرسال، @ للإشارة إلى مهمة)"
            rows={2}
            className="w-full resize-none rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none"
          />
          <button
            onClick={submit}
            disabled={!draft.trim()}
            className="mt-1 rounded-md bg-primary px-3 py-1 text-xs font-medium text-white disabled:opacity-40"
          >
            إرسال
          </button>
        </div>
      </div>

      {feed.length === 0 ? (
        <div className="py-4 text-center text-sm text-gray-400">لا يوجد نشاط بعد</div>
      ) : (
        <div className="space-y-2">
          {feed.map((item) => {
            if (item.kind === "activity") {
              const a = item.data;
              return (
                <div key={`a-${a.id}`} className="flex items-start gap-2 text-sm">
                  <History className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-300" />
                  <div className="flex-1">
                    <span className="text-gray-700">
                      {nameOf(a.changed_by)} {ACTION_LABELS[a.action] ?? a.action}
                    </span>
                    <div className="text-xs text-gray-400">{new Date(a.created_at).toLocaleString("ar-u-nu-latn")}</div>
                  </div>
                </div>
              );
            }

            const c = item.data;
            const text = (c.body as { text?: string } | null)?.text ?? "";
            const isMine = c.author_user_id === user?.id;
            const isEditing = editingId === c.id;

            return (
              <div key={`c-${c.id}`} className={`flex items-start gap-2 rounded-md p-2 text-sm ${c.is_resolved ? "bg-gray-50" : ""}`}>
                <MessageSquare className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${c.is_resolved ? "text-green-400" : "text-gray-300"}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">{nameOf(c.author_user_id)}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onToggleResolved(c.id, !c.is_resolved)}
                        className={`rounded p-0.5 ${c.is_resolved ? "text-green-500" : "text-gray-300 hover:text-gray-500"}`}
                        title={c.is_resolved ? "إعادة فتح" : "تحديد كمحلول"}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      {isMine && !isEditing && (
                        <>
                          <button
                            onClick={() => {
                              setEditingId(c.id);
                              setEditDraft(text);
                            }}
                            className="rounded p-0.5 text-gray-300 hover:text-gray-500"
                            title="تعديل"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteComment(c.id)}
                            className="rounded p-0.5 text-gray-300 hover:text-red-500"
                            title="حذف"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="mt-1 flex items-center gap-1.5">
                      <MentionTextarea
                        autoFocus
                        value={editDraft}
                        onChange={setEditDraft}
                        excludeTaskId={excludeTaskId}
                        rows={1}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            submitEdit(c.id);
                          }
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="flex-1 resize-none rounded border border-gray-200 px-1.5 py-1 text-sm outline-none"
                      />
                      <button onClick={() => submitEdit(c.id)} className="text-primary">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <MentionText text={text} onNavigateToTask={onNavigateToTask} />
                  )}
                  <div className="text-xs text-gray-400">
                    {new Date(c.created_at).toLocaleString("ar-u-nu-latn")}
                    {c.updated_at !== c.created_at && " (معدّل)"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
