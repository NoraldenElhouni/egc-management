import { useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useClickOutside } from "../../../hooks/tasks/useClickOutside";
import { useAnchoredPosition } from "../../../hooks/tasks/useAnchoredPosition";

// The one dropdown every task cell and picker uses (status, priority, task
// type, custom fields, tags, links, ...).
//
// Why not a plain `absolute top-full` child of the trigger, as these used
// to be: the task lists put each group in an `overflow-hidden` card and the
// board table scrolls, so a menu opened on a row near the bottom of its card
// was cut off or hidden behind the next card. Here the menu is portaled to
// document.body and positioned (fixed) from the trigger's screen rect by
// useAnchoredPosition: it opens below the trigger when it fits, above it
// when it doesn't, stays inside the window sideways, and follows the
// trigger while the list scrolls. Nothing in the page can clip it.
//
// Click-outside lives here, not in the caller: the menu's DOM is no longer
// inside the trigger's wrapper, so a caller checking only its own ref would
// close the menu on a click on one of its own options.
//
// Renders nothing while closed, so the listeners only exist while open.

interface AnchoredMenuProps {
  open: boolean;
  onClose: () => void;
  /** The trigger (or its wrapper) the menu hangs from. Clicks on it don't count as "outside". */
  anchorRef: RefObject<HTMLElement | null>;
  /** Pixel width — the position needs it before the menu has rendered. Match the w-* class. */
  width: number;
  /** "right" (default) lines the menu's right edge up with the trigger's; "left" its left edge. */
  align?: "left" | "right";
  /** Extra classes for the panel (padding, max-height, ...). Width is set by `width`. */
  className?: string;
  children: ReactNode;
}

function OpenMenu({ onClose, anchorRef, width, align = "right", className = "", children }: Omit<AnchoredMenuProps, "open">) {
  const popoverRef = useRef<HTMLDivElement>(null);
  useClickOutside([anchorRef, popoverRef], onClose);
  const pos = useAnchoredPosition(anchorRef, popoverRef, { open: true, width, align });

  return createPortal(
    <div
      ref={popoverRef}
      dir="rtl"
      style={{
        position: "fixed",
        top: pos?.top ?? 0,
        left: pos?.left ?? 0,
        width,
        // hidden until placed, so it never flashes at the top-left corner
        visibility: pos ? "visible" : "hidden",
      }}
      className={`z-50 rounded-lg border border-gray-200 bg-white shadow-lg ${className}`}
    >
      {children}
    </div>,
    document.body,
  );
}

export default function AnchoredMenu({ open, ...rest }: AnchoredMenuProps) {
  if (!open) return null;
  return <OpenMenu {...rest} />;
}
