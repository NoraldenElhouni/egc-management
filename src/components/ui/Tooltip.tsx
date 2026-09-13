import type { ReactNode } from "react";

// A native title="" tooltip waits for the browser/OS hover delay
// (~1-1.5s) before it appears — too slow for something people check
// constantly, like "who is that avatar". This is CSS-only (group-hover),
// so it shows the instant the pointer enters, with just a short fade so
// it doesn't feel like it's popping.
interface TooltipProps {
  label: string | null | undefined;
  children: ReactNode;
  className?: string;
}

export default function Tooltip({ label, children, className = "" }: TooltipProps) {
  if (!label) return <>{children}</>;

  return (
    <span className={`group/tooltip relative inline-flex ${className}`}>
      {children}
      <span
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-75 group-hover/tooltip:opacity-100"
        role="tooltip"
      >
        {label}
      </span>
    </span>
  );
}
