import { useEffect, type RefObject } from "react";

// Same outside-click mechanic as ProfileDropdown.tsx (this repo has no
// shared Popover primitive — see useTasksSidebar.ts's header note on
// tasksDb for the parallel "no generated types yet" situation). Factored
// out here because D2's three inline-edit cells (status/priority/assignee)
// all need it, not because it's meant as an app-wide primitive.
//
// Accepts one ref or several — CalendarPopover portals itself to
// document.body (so it can't be clipped/covered by the board's sticky
// header), which means its DOM node sits outside the trigger's own ref
// entirely; it needs both the trigger's ref and its own to both count as
// "inside" for this check to still work.
export function useClickOutside(
  refs: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[],
  onOutside: () => void,
) {
  useEffect(() => {
    const list = Array.isArray(refs) ? refs : [refs];
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      const isInside = list.some((ref) => ref.current && ref.current.contains(target));
      if (!isInside) onOutside();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [refs, onOutside]);
}
