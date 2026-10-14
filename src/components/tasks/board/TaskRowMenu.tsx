import type { ReactNode } from "react";
import { ExternalLink, Link2, Unlink } from "lucide-react";
import { PointMenu } from "./AnchoredMenu";
import { WAIT_STYLE } from "./DependencyBadges";
import { allPairs, neighbours, pairFor } from "./DependencyPopover";
import type { TaskLinks } from "../../../hooks/tasks/dependencyFlags";
import type { DependencyPair, TaskRow } from "../../../hooks/tasks/useTaskBoard";

// A board row's right-click menu: open the task, and the quick link
// actions — "starts after the task above" in one click, the link editor,
// and removing every link at once (one Ctrl+Z brings them back).

function MenuItem({
  icon,
  danger = false,
  onClick,
  children,
}: {
  icon: ReactNode;
  danger?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-2 px-3 py-1.5 text-right text-sm hover:bg-gray-50 ${
        danger ? "text-red-600" : "text-gray-700"
      }`}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  );
}

interface TaskRowMenuProps {
  point: { x: number; y: number } | null;
  onClose: () => void;
  task: TaskRow;
  links: TaskLinks | undefined;
  childrenByParent: Map<string | null, TaskRow[]>;
  /** Link actions need edit rights on the task. */
  canEdit: boolean;
  onOpenTask: () => void;
  /** Opens the row's "تبدأ بعد" editor. */
  onOpenLinks: () => void;
  onLink: (pair: DependencyPair) => void;
  onUnlink: (pairs: DependencyPair[]) => void;
}

export default function TaskRowMenu({
  point,
  onClose,
  task,
  links,
  childrenByParent,
  canEdit,
  onOpenTask,
  onOpenLinks,
  onLink,
  onUnlink,
}: TaskRowMenuProps) {
  const { previous } = neighbours(task, childrenByParent);
  const linkedIds = new Set([...(links?.waitsFor ?? []), ...(links?.waitedBy ?? [])].map((l) => l.taskId));
  const linkPrevious = previous && !linkedIds.has(previous.id) ? previous : null;
  const pairs = allPairs(task.id, links);
  const run = (action: () => void) => () => {
    onClose();
    action();
  };

  return (
    <PointMenu point={point} onClose={onClose} width={250} className="py-1">
      <MenuItem icon={<ExternalLink className="h-3.5 w-3.5 text-gray-400" />} onClick={run(onOpenTask)}>
        فتح المهمة
      </MenuItem>
      {canEdit && (
        <>
          <div className="my-1 border-t border-gray-100" />
          {linkPrevious && (
            <MenuItem
              icon={<WAIT_STYLE.Icon className={`h-3.5 w-3.5 ${WAIT_STYLE.text}`} />}
              onClick={run(() => onLink(pairFor(task.id, linkPrevious.id, "blockedBy")))}
            >
              <div>تبدأ بعد المهمة السابقة</div>
              <div className="truncate text-[11px] text-gray-400">{linkPrevious.title}</div>
            </MenuItem>
          )}
          <MenuItem icon={<Link2 className="h-3.5 w-3.5 text-gray-400" />} onClick={run(onOpenLinks)}>
            ربط بمهمة…
          </MenuItem>
          {pairs.length > 0 && (
            <MenuItem danger icon={<Unlink className="h-3.5 w-3.5" />} onClick={run(() => onUnlink(pairs))}>
              إزالة كل الروابط ({pairs.length})
            </MenuItem>
          )}
        </>
      )}
    </PointMenu>
  );
}
