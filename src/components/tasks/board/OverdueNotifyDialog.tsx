import { useState } from "react";
import { AlertTriangle, BellRing, Loader2, X } from "lucide-react";
import type { AssignablePerson } from "../../../hooks/tasks/useAssignablePeople";
import {
  DEFAULT_OVERDUE_MESSAGE,
  DEFAULT_OVERDUE_TITLE,
  MAX_MESSAGE_LENGTH,
  buildOverdueBody,
  type OverdueRecipientSummary,
  type OverdueSendOutcome,
} from "./overdueNotify";

// Self-contained shell (own backdrop, own dir="rtl", own footer), the
// same shape as DirectoryFilterSortPopover and ReverseDistributionDialog.
// Not ui/ConfirmDialog — its `message` prop is a string and can't host a
// textarea; not ui/Dialog — it has no title, footer or RTL.
//
// Two panels in one shell: compose, then result. It deliberately does
// NOT close on success: with no record of sends kept anywhere, this
// panel is the only evidence of who was reached, and it is gone the
// moment the dialog closes.

interface OverdueNotifyDialogProps {
  summary: OverdueRecipientSummary;
  employeesById: Map<string, AssignablePerson>;
  searchTerm: string;
  sending: boolean;
  outcome: OverdueSendOutcome | null;
  onSend: (title: string, message: string) => void;
  onClose: () => void;
}

function nameOf(employeesById: Map<string, AssignablePerson>, userId: string): string {
  const person = employeesById.get(userId);
  if (!person) return "موظف";
  return `${person.first_name} ${person.last_name ?? ""}`.trim();
}

export default function OverdueNotifyDialog({
  summary,
  employeesById,
  searchTerm,
  sending,
  outcome,
  onSend,
  onClose,
}: OverdueNotifyDialogProps) {
  const [title, setTitle] = useState(DEFAULT_OVERDUE_TITLE);
  const [message, setMessage] = useState(DEFAULT_OVERDUE_MESSAGE);

  const { recipients, overdueTaskCount, unassignedTaskCount, selfTaskCount } = summary;
  const canSend = recipients.length > 0 && title.trim().length > 0 && !sending;

  // Contractors can be assignees too (assignable_people unions employees
  // and contractors), so the list is shown by name with the external
  // ones marked — a number alone hides the fact that an outside party is
  // about to be messaged.
  const contractorCount = recipients.filter(
    (r) => employeesById.get(r.userId)?.person_type === "contractor",
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" dir="rtl" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <BellRing className="h-4 w-4 text-amber-500" />
            تنبيه أصحاب المهام المتأخرة
          </h2>
          <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100" aria-label="إغلاق">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {outcome ? (
            <ResultPanel outcome={outcome} employeesById={employeesById} />
          ) : (
            <>
              <p className="text-sm text-gray-700">
                سيتم إشعار <span className="font-semibold">{recipients.length}</span> شخصاً بخصوص{" "}
                <span className="font-semibold">{overdueTaskCount}</span> مهمة متأخرة.
              </p>
              <p className="mt-1 text-xs text-gray-400">
                المستلمون محسوبون من المهام المطابقة للفلاتر الحالية
                {searchTerm.trim() ? ` والبحث عن "${searchTerm.trim()}"` : ""} — وليس من المهام الظاهرة على الشاشة فقط،
                فالأقسام المطوية محسوبة أيضاً.
              </p>

              <ul className="mt-3 space-y-1 text-xs">
                {contractorCount > 0 && (
                  <li className="flex items-start gap-1.5 text-amber-600">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                    <span>من بينهم {contractorCount} مقاول من خارج الشركة.</span>
                  </li>
                )}
                {unassignedTaskCount > 0 && (
                  <li className="flex items-start gap-1.5 text-amber-600">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                    <span>{unassignedTaskCount} مهمة متأخرة بدون مسؤول — لن يصلها إشعار.</span>
                  </li>
                )}
                {selfTaskCount > 0 && (
                  <li className="text-gray-400">لن يتم إشعارك بمهامك أنت ({selfTaskCount}).</li>
                )}
                <li className="text-gray-400">
                  يصل الإشعار فقط لمن سجّل الدخول على تطبيق الهاتف — مستخدمو الكمبيوتر فقط لن يصلهم شيء.
                </li>
              </ul>

              <div className="mt-4">
                <label className="mb-1 block text-xs font-semibold text-gray-500" htmlFor="overdue-title">
                  العنوان
                </label>
                <input
                  id="overdue-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-500" htmlFor="overdue-message">
                    الرسالة
                  </label>
                  <span className="text-[10px] text-gray-400">
                    {message.length} / {MAX_MESSAGE_LENGTH}
                  </span>
                </div>
                <textarea
                  id="overdue-message"
                  value={message}
                  maxLength={MAX_MESSAGE_LENGTH}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              {recipients.length > 0 && (
                <div className="mt-3 rounded-md bg-gray-50 p-3">
                  <div className="mb-1 text-[10px] font-semibold text-gray-400">
                    معاينة — كما ستصل {nameOf(employeesById, recipients[0].userId)}
                  </div>
                  <div className="text-xs font-semibold text-gray-700">{title || "—"}</div>
                  <div className="whitespace-pre-line text-xs text-gray-600">
                    {buildOverdueBody(recipients[0].taskCount, message)}
                  </div>
                </div>
              )}

              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-gray-500">
                  عرض المستلمين ({recipients.length})
                </summary>
                <ul className="mt-2 max-h-32 space-y-0.5 overflow-y-auto text-xs text-gray-600">
                  {recipients.map((r) => (
                    <li key={r.userId} className="flex items-center justify-between gap-2">
                      <span className="truncate">
                        {nameOf(employeesById, r.userId)}
                        {employeesById.get(r.userId)?.person_type === "contractor" && (
                          <span className="mr-1 rounded bg-amber-50 px-1 text-[10px] text-amber-600">مقاول</span>
                        )}
                      </span>
                      <span className="shrink-0 text-gray-400">{r.taskCount}</span>
                    </li>
                  ))}
                </ul>
              </details>
            </>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
          <span className="text-[10px] text-gray-400">
            {outcome ? "لا يُحفظ سجل بالإشعارات المرسلة." : "لا يمكن التراجع بعد الإرسال."}
          </span>
          {outcome ? (
            <button
              onClick={onClose}
              className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary/90"
            >
              تم
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="rounded-md px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50">
                إلغاء
              </button>
              <button
                onClick={() => onSend(title, message)}
                disabled={!canSend}
                className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                إرسال
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultPanel({
  outcome,
  employeesById,
}: {
  outcome: OverdueSendOutcome;
  employeesById: Map<string, AssignablePerson>;
}) {
  return (
    <div className="space-y-3 text-sm">
      <p className="text-gray-700">
        تم إرسال الطلب إلى <span className="font-semibold">{outcome.deliveredUserIds.length}</span> من{" "}
        {outcome.attemptedUserIds.length}.
      </p>
      {/* "Request sent", not "delivered" — a clean invoke means the Edge
          Function accepted it, not that Expo accepted the tokens and
          certainly not that a phone displayed anything. */}
      <p className="text-[10px] text-gray-400">
        الإرسال يعني قبول الطلب — لا يمكن تأكيد وصول الإشعار إلى الجهاز.
      </p>

      {outcome.unreachableUserIds.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-amber-600">
            لم يصلهم الإشعار — لا يوجد تطبيق مسجّل ({outcome.unreachableUserIds.length})
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {outcome.unreachableUserIds
              .map((id) => nameOf(employeesById, id))
              .join("، ")}
          </div>
        </div>
      )}

      {outcome.failedUserIds.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-red-600">
            فشل الإرسال ({outcome.failedUserIds.length})
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {outcome.failedUserIds.map((id) => nameOf(employeesById, id)).join("، ")}
          </div>
          {outcome.errors.length > 0 && (
            <div className="mt-1 text-[10px] text-gray-400">{outcome.errors[0]}</div>
          )}
        </div>
      )}
    </div>
  );
}
