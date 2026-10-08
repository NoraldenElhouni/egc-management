import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronDown, Folder } from "lucide-react";
import { useTasksSidebar, type BoardWithCount } from "../../../hooks/tasks/useTasksSidebar";
import { useClickOutside } from "../../../hooks/tasks/useClickOutside";

// Jump to another board of the same space from the board header.
//
// Reads the sidebar's already-cached tree (useTasksSidebar), so it costs no
// extra query and shows exactly the boards the sidebar would — same access
// rules. Boards keep their saved order (boards.sort_order), grouped by
// folder like the sidebar. Renders nothing when the space has no other
// board to switch to (or the board isn't in the sidebar, e.g. a template).
interface BoardSwitcherProps {
  spaceId: string;
  currentBoardId: string;
  /** Keep the user on the same view (list / gantt) after switching. */
  view: "list" | "gantt";
}

const bySortOrder = (a: BoardWithCount, b: BoardWithCount) =>
  a.board.sort_order - b.board.sort_order || a.board.name.localeCompare(b.board.name);

export default function BoardSwitcher({ spaceId, currentBoardId, view }: BoardSwitcherProps) {
  const navigate = useNavigate();
  const { data } = useTasksSidebar();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const groups = useMemo(() => {
    if (!data) return [];
    for (const nodes of Object.values(data.spacesByType)) {
      const node = nodes.find((n) => n.space.id === spaceId);
      if (!node) continue;
      const result: { key: string; label: string | null; boards: BoardWithCount[] }[] = [];
      if (node.boards.length > 0) {
        result.push({ key: "root", label: null, boards: [...node.boards].sort(bySortOrder) });
      }
      for (const f of [...node.folders].sort((a, b) => a.folder.sort_order - b.folder.sort_order)) {
        if (f.boards.length > 0) {
          result.push({ key: f.folder.id, label: f.folder.name, boards: [...f.boards].sort(bySortOrder) });
        }
      }
      return result;
    }
    return [];
  }, [data, spaceId]);

  const boardCount = groups.reduce((sum, g) => sum + g.boards.length, 0);
  const containsCurrent = groups.some((g) => g.boards.some((b) => b.board.id === currentBoardId));
  if (!containsCurrent || boardCount < 2) return null;

  const go = (boardId: string) => {
    setOpen(false);
    if (boardId === currentBoardId) return;
    navigate(`/tasks/board/${boardId}${view === "gantt" ? "/gantt" : ""}`);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
        title="التبديل إلى لوحة أخرى في هذه المساحة"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        لوحات المساحة
        <span className="text-gray-400">({boardCount})</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full z-30 mt-1 max-h-80 w-64 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {groups.map((group) => (
            <div key={group.key}>
              {group.label && (
                <div className="flex items-center gap-1.5 px-3 pb-1 pt-2 text-xs font-medium text-gray-400">
                  <Folder className="h-3 w-3" />
                  <span className="truncate">{group.label}</span>
                </div>
              )}
              {group.boards.map(({ board, openCount, zoneName }) => {
                const active = board.id === currentBoardId;
                return (
                  <button
                    key={board.id}
                    role="option"
                    aria-selected={active}
                    onClick={() => go(board.id)}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-right text-sm ${
                      active ? "bg-primary-superLight font-medium text-primary" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="flex-1 truncate">
                      {board.name}
                      {zoneName && zoneName !== board.name && (
                        <span className="mr-1.5 text-xs font-normal text-gray-400">{zoneName}</span>
                      )}
                    </span>
                    {active ? (
                      <Check className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      openCount > 0 && <span className="shrink-0 text-xs text-gray-400">{openCount}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
