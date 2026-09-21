import type { TaskRow } from "../../../hooks/tasks/useTaskBoard";
import { notifyUsersDetailed } from "../../../services/notifications/pushNotifications";

// Pure logic for the "chase the people with overdue work" button — no
// JSX, so the plural rule and the recipient maths are trivially
// testable and the dialog stays presentational. Sibling of
// directoryFilters.ts for the same reason.

export interface OverdueRecipient {
  userId: string;
  /** Distinct visible overdue tasks this person is on. */
  taskCount: number;
}

export interface OverdueRecipientSummary {
  /** Sorted by taskCount descending. Excludes the acting user. */
  recipients: OverdueRecipient[];
  /** Visible tasks that are actually overdue. */
  overdueTaskCount: number;
  /** Overdue, but nobody is assigned — no message can reach them. */
  unassignedTaskCount: number;
  /** Overdue tasks the acting user is on, excluded from the send. */
  selfTaskCount: number;
}

export const DEFAULT_OVERDUE_TITLE = "تذكير بالمهام المتأخرة";
export const DEFAULT_OVERDUE_MESSAGE = "يرجى مراجعة مهامك المتأخرة وتحديث حالتها اليوم.";

/** Hard cap on the editable message. Expo caps a whole message at ~4KB;
 *  well before that, a phone's notification shade shows about two lines,
 *  so anything longer is invisible rather than merely long. */
export const MAX_MESSAGE_LENGTH = 200;

/**
 * Who should be told, and about how many tasks each.
 *
 * Counts DISTINCT task ids per person: assigneesByTask is built by
 * pushing rows with no dedupe, so a duplicated task_assignees row would
 * otherwise inflate somebody's count.
 *
 * `is_overdue` is a denormalized flag recomputed by cron every 15
 * minutes, so it can lag. Where the task also carries a due_date we
 * re-check it here — a task closed or rescheduled ten minutes ago
 * shouldn't generate a nag saying it's late.
 */
export function resolveOverdueRecipients(
  visibleTasks: TaskRow[],
  assigneesByTask: Map<string, string[]>,
  options: { excludeUserId?: string | null; now?: Date } = {},
): OverdueRecipientSummary {
  const { excludeUserId = null, now = new Date() } = options;
  const nowMs = now.getTime();

  const taskIdsByUser = new Map<string, Set<string>>();
  let overdueTaskCount = 0;
  let unassignedTaskCount = 0;
  let selfTaskCount = 0;

  for (const task of visibleTasks) {
    if (!task.is_overdue) continue;
    // Trust due_date over the cron flag when we have one.
    if (task.due_date && new Date(task.due_date).getTime() > nowMs) continue;

    overdueTaskCount++;

    const assignees = Array.from(new Set(assigneesByTask.get(task.id) ?? []));
    if (assignees.length === 0) {
      unassignedTaskCount++;
      continue;
    }

    let countedSelf = false;
    for (const userId of assignees) {
      if (excludeUserId && userId === excludeUserId) {
        // Counted once per task, not once per assignment.
        if (!countedSelf) {
          selfTaskCount++;
          countedSelf = true;
        }
        continue;
      }
      const set = taskIdsByUser.get(userId) ?? new Set<string>();
      set.add(task.id);
      taskIdsByUser.set(userId, set);
    }
  }

  const recipients = Array.from(taskIdsByUser.entries())
    .map(([userId, taskIds]) => ({ userId, taskCount: taskIds.size }))
    .sort((a, b) => b.taskCount - a.taskCount);

  return { recipients, overdueTaskCount, unassignedTaskCount, selfTaskCount };
}

/**
 * Arabic has four number forms and using the wrong one reads as broken.
 * مهمة is feminine:
 *
 *   1        مهمة متأخرة واحدة        singular
 *   2        مهمتان متأخرتان          dual
 *   3–10     N مهام متأخرة            paucal — plural noun, plural adjective
 *   else     N مهمة متأخرة            singular tamyiz
 *
 * Keyed on n % 100, not n: 103 takes the 3–10 form, while 111 and 200
 * take the last one.
 *
 * Digits stay Latin (3, 11) — the house convention in this module is
 * explicit about it, see MyWorkPage.tsx's "-u-nu-latn keeps Arabic month
 * names but forces Western (1 2 3) digits".
 */
export function overdueTaskCountPhrase(count: number): string {
  if (count === 1) return "مهمة متأخرة واحدة";
  if (count === 2) return "مهمتان متأخرتان";

  const mod100 = count % 100;
  if (mod100 >= 3 && mod100 <= 10) return `${count} مهام متأخرة`;
  return `${count} مهمة متأخرة`;
}

/** The count line is prepended, not appended — a phone truncates the
 *  tail, and "how many" is the part that must survive. */
export function buildOverdueBody(taskCount: number, message: string): string {
  const trimmed = message.trim();
  const lead = `لديك ${overdueTaskCountPhrase(taskCount)}.`;
  return trimmed ? `${lead}\n${trimmed}` : lead;
}

export interface OverdueSendOutcome {
  attemptedUserIds: string[];
  deliveredUserIds: string[];
  /** No push token on file — never received it. */
  unreachableUserIds: string[];
  /** Had a token, but the send errored. Retry should target ONLY these. */
  failedUserIds: string[];
  errors: string[];
}

/**
 * Sends one summary push per person.
 *
 * The body differs between people only by the task count, and
 * notifyUsersDetailed takes one title/body for a whole batch — so
 * recipients are grouped BY COUNT rather than sent one at a time.
 * Everyone with 5 late tasks shares a call, everyone with 3 shares
 * another. Calls = distinct counts, which stays under ten regardless of
 * headcount.
 *
 * No deep link is attached. Fields routes `data.url` straight into
 * router.push, and its own "my work" screen is a company route while
 * contractors — who can also be assignees — live under a different one.
 * A wrong route on tap is worse than no route, so this is left off until
 * the mobile handler grows a per-audience rule.
 */
export async function sendOverdueReminders(
  recipients: OverdueRecipient[],
  title: string,
  message: string,
): Promise<OverdueSendOutcome> {
  const byCount = new Map<number, string[]>();
  for (const r of recipients) {
    const list = byCount.get(r.taskCount) ?? [];
    list.push(r.userId);
    byCount.set(r.taskCount, list);
  }

  const outcome: OverdueSendOutcome = {
    attemptedUserIds: recipients.map((r) => r.userId),
    deliveredUserIds: [],
    unreachableUserIds: [],
    failedUserIds: [],
    errors: [],
  };

  for (const [taskCount, userIds] of byCount) {
    const result = await notifyUsersDetailed(userIds, title, buildOverdueBody(taskCount, message));

    outcome.unreachableUserIds.push(...result.unreachableUserIds);
    outcome.failedUserIds.push(...result.failedUserIds);
    outcome.errors.push(...result.errors);
    outcome.deliveredUserIds.push(
      ...result.reachableUserIds.filter((id) => !result.failedUserIds.includes(id)),
    );
  }

  return outcome;
}
