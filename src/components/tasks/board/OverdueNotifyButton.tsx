import { useMemo, useState } from "react";
import { BellRing } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import type { TaskRow } from "../../../hooks/tasks/useTaskBoard";
import type { TaskDirectoryData } from "../../../hooks/tasks/useTaskDirectory";
import type { DirectoryFilterState } from "./directoryFilters";
import OverdueNotifyDialog from "./OverdueNotifyDialog";
import { resolveOverdueRecipients, sendOverdueReminders, type OverdueSendOutcome } from "./overdueNotify";

// Renders nothing unless the "متأخرة فقط" filter is on — the button only
// makes sense against a list that is already just late work.
//
// Owns the dialog and the send lifecycle so each directory page adds one
// line rather than five pieces of state.
//
// Deliberately NOT useMutation: the tasks module installs a global
// MutationCache.onError that raises a red toast (TasksLayout.tsx), which
// would fire alongside — and contradict — this dialog's own result
// panel, since a partial send is neither a success nor an error.

interface OverdueNotifyButtonProps {
  visibleTasks: TaskRow[];
  data: TaskDirectoryData;
  filters: DirectoryFilterState;
  searchTerm: string;
}

export default function OverdueNotifyButton({
  visibleTasks,
  data,
  filters,
  searchTerm,
}: OverdueNotifyButtonProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [outcome, setOutcome] = useState<OverdueSendOutcome | null>(null);

  const summary = useMemo(
    () => resolveOverdueRecipients(visibleTasks, data.assigneesByTask, { excludeUserId: user?.id ?? null }),
    [visibleTasks, data.assigneesByTask, user?.id],
  );

  if (!filters.overdueOnly) return null;

  const recipientCount = summary.recipients.length;

  const close = () => {
    setOpen(false);
    setOutcome(null);
  };

  const handleSend = async (title: string, message: string) => {
    if (sending) return; // guards a double-click on top of the disabled attribute
    setSending(true);
    try {
      setOutcome(await sendOverdueReminders(summary.recipients, title, message));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={recipientCount === 0}
        title={recipientCount === 0 ? "لا يوجد مستلمون" : "إشعار أصحاب المهام المتأخرة"}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <BellRing className="h-3.5 w-3.5" />
        تنبيه المتأخرين
        {recipientCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">
            {recipientCount}
          </span>
        )}
      </button>

      {open && (
        <OverdueNotifyDialog
          summary={summary}
          employeesById={data.employeesById}
          searchTerm={searchTerm}
          sending={sending}
          outcome={outcome}
          onSend={handleSend}
          onClose={close}
        />
      )}
    </>
  );
}
