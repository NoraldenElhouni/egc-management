import { useLayoutEffect, useState, type RefObject } from "react";

// Screen position for a dropdown that's portaled to document.body and
// anchored to a trigger button — CalendarPopover's approach, shared.
// A plain `absolute top-full` dropdown inside a board row gets clipped by
// the scrolling task list when the row is near the bottom (the menu opens
// below the last card, out of view). Here it opens below the trigger when
// it fits, above it when it doesn't, stays inside the viewport sideways,
// and follows the trigger while the list scrolls.
export function useAnchoredPosition(
  anchorRef: RefObject<HTMLElement | null>,
  popoverRef: RefObject<HTMLElement | null>,
  { open, width, align = "right" }: { open: boolean; width: number; align?: "left" | "right" },
): { top: number; left: number } | null {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }

    const place = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const height = popoverRef.current?.offsetHeight ?? 0;
      const margin = 8;

      let top = rect.bottom + 4;
      if (height && top + height > window.innerHeight - margin) {
        const above = rect.top - height - 4;
        top = above >= margin ? above : Math.max(margin, window.innerHeight - height - margin);
      }

      const preferredLeft = align === "left" ? rect.left : rect.right - width;
      const left = Math.min(Math.max(margin, preferredLeft), window.innerWidth - width - margin);

      setPos((prev) => (prev && prev.top === top && prev.left === left ? prev : { top, left }));
    };

    place();
    // the first pass can't know the popover's height yet (it renders
    // hidden until positioned) — measure again once it's laid out
    const frame = requestAnimationFrame(place);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, anchorRef, popoverRef, width, align]);

  return pos;
}
