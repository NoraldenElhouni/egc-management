import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

// A native title="" tooltip waits for the browser/OS hover delay
// (~1-1.5s) before it appears — too slow for something people check
// constantly, like "who is that avatar". This shows the instant the
// pointer enters instead.
//
// Portaled to document.body, not a plain absolute-positioned CSS
// group-hover child (this component's own original approach): opening
// upward (the default) puts it right where a sticky table header sits
// for a trigger in the first row of a scrollable list — it was rendering
// underneath that header there. Portaling avoids that regardless of any
// ancestor's stacking/overflow, and flipping to open downward when
// there isn't room above (like that first-row case) avoids relying on
// portaling alone to save it.
interface TooltipProps {
  label: string | null | undefined;
  children: ReactNode;
  className?: string;
}

const GAP = 6;
const MIN_CLEARANCE_ABOVE = 60; // roughly a sticky table header's height

export default function Tooltip({ label, children, className = "" }: TooltipProps) {
  const [hovered, setHovered] = useState(false);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; placement: "top" | "bottom" } | null>(null);

  useLayoutEffect(() => {
    if (!hovered) return;
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const openAbove = rect.top >= MIN_CLEARANCE_ABOVE;
    setPos({
      top: openAbove ? rect.top - GAP : rect.bottom + GAP,
      left: rect.left + rect.width / 2,
      placement: openAbove ? "top" : "bottom",
    });
  }, [hovered]);

  if (!label) return <>{children}</>;

  return (
    <span
      ref={anchorRef}
      className={`inline-flex ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      {hovered &&
        pos &&
        createPortal(
          <span
            role="tooltip"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              transform: pos.placement === "top" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
            }}
            className="pointer-events-none z-50 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[11px] font-medium text-white shadow-lg"
          >
            {label}
          </span>,
          document.body,
        )}
    </span>
  );
}
