import { useEffect, type RefObject } from "react";

// Same outside-click mechanic as ProfileDropdown.tsx (this repo has no
// shared Popover primitive — see useTasksSidebar.ts's header note on
// tasksDb for the parallel "no generated types yet" situation). Factored
// out here because D2's three inline-edit cells (status/priority/assignee)
// all need it, not because it's meant as an app-wide primitive.
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onOutside: () => void,
) {
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOutside();
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [ref, onOutside]);
}
