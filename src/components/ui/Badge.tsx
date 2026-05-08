import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "purple"
  | "outline";

export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Optional icon rendered before the label — pass any React node (SVG, emoji, icon component) */
  icon?: React.ReactNode;
  /** Adds a small colored dot before the label */
  dot?: boolean;
  /** Makes the badge pill-shaped (fully rounded). Default: true */
  pill?: boolean;
  /** onClick turns the badge into a clickable element */
  onClick?: () => void;
  className?: string;
}

// ─── Token maps ───────────────────────────────────────────────────────────────

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: {
    background: "#F1EFE8",
    color: "#5F5E5A",
    border: "0.5px solid #D3D1C7",
  },
  success: {
    background: "#E1F5EE",
    color: "#085041",
    border: "0.5px solid #9FE1CB",
  },
  warning: {
    background: "#FAEEDA",
    color: "#633806",
    border: "0.5px solid #FAC775",
  },
  danger: {
    background: "#FCEBEB",
    color: "#791F1F",
    border: "0.5px solid #F7C1C1",
  },
  info: {
    background: "#E6F1FB",
    color: "#0C447C",
    border: "0.5px solid #85B7EB",
  },
  purple: {
    background: "#F0EAFB",
    color: "#4A1D96",
    border: "0.5px solid #C4B5FD",
  },
  outline: {
    background: "transparent",
    color: "currentColor",
    border: "0.5px solid currentColor",
  },
};

const dotColors: Record<BadgeVariant, string> = {
  default: "#9E9D98",
  success: "#0F6E56",
  warning: "#EF9F27",
  danger: "#E24B4A",
  info: "#185FA5",
  purple: "#7C3AED",
  outline: "currentColor",
};

const sizeStyles: Record<BadgeSize, React.CSSProperties> = {
  sm: { fontSize: "11px", padding: "1px 7px", gap: "4px" },
  md: { fontSize: "12px", padding: "2px 9px", gap: "5px" },
  lg: { fontSize: "13px", padding: "4px 12px", gap: "6px" },
};

const dotSizes: Record<BadgeSize, number> = { sm: 5, md: 6, lg: 7 };

// ─── Component ────────────────────────────────────────────────────────────────

export default function Badge({
  label,
  variant = "default",
  size = "md",
  icon,
  dot = false,
  pill = true,
  onClick,
  className,
}: BadgeProps) {
  const isClickable = typeof onClick === "function";

  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    fontWeight: 500,
    lineHeight: 1,
    whiteSpace: "nowrap",
    userSelect: "none",
    borderRadius: pill ? "999px" : "4px",
    cursor: isClickable ? "pointer" : "default",
    transition: "opacity 0.15s, filter 0.15s",
    textDecoration: "none",
    boxSizing: "border-box",
    ...variantStyles[variant],
    ...sizeStyles[size],
  };

  const dotStyle: React.CSSProperties = {
    width: dotSizes[size],
    height: dotSizes[size],
    borderRadius: "50%",
    backgroundColor: dotColors[variant],
    flexShrink: 0,
  };

  const iconStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
    fontSize: size === "sm" ? "11px" : size === "lg" ? "14px" : "12px",
    lineHeight: 1,
  };

  function handleKeyDown(e: React.KeyboardEvent) {
    if (isClickable && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick?.();
    }
  }

  return (
    <span
      style={baseStyle}
      className={className}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      onMouseEnter={
        isClickable
          ? (e) => {
              (e.currentTarget as HTMLElement).style.filter =
                "brightness(0.92)";
            }
          : undefined
      }
      onMouseLeave={
        isClickable
          ? (e) => {
              (e.currentTarget as HTMLElement).style.filter = "";
            }
          : undefined
      }
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={isClickable ? label : undefined}
    >
      {dot && <span style={dotStyle} aria-hidden="true" />}
      {icon && !dot && (
        <span style={iconStyle} aria-hidden="true">
          {icon}
        </span>
      )}
      {label}
    </span>
  );
}

// ─── Pre-configured status shortcuts ─────────────────────────────────────────
// Import StatusBadge and use e.g. <StatusBadge.Active /> anywhere in your app.

export const StatusBadge = {
  Active: (p?: Partial<BadgeProps>) => (
    <Badge label="نشط" variant="success" dot {...p} />
  ),
  Bidding: (p?: Partial<BadgeProps>) => (
    <Badge label="قيد العروض" variant="warning" dot {...p} />
  ),
  Awarded: (p?: Partial<BadgeProps>) => (
    <Badge label="تم الترسية" variant="info" dot {...p} />
  ),
  Completed: (p?: Partial<BadgeProps>) => (
    <Badge label="مكتمل" variant="default" dot {...p} />
  ),
  Cancelled: (p?: Partial<BadgeProps>) => (
    <Badge label="ملغى" variant="danger" dot {...p} />
  ),
  Pending: (p?: Partial<BadgeProps>) => (
    <Badge label="معلق" variant="warning" dot {...p} />
  ),
  Paid: (p?: Partial<BadgeProps>) => (
    <Badge label="مدفوع" variant="success" dot {...p} />
  ),
  Rejected: (p?: Partial<BadgeProps>) => (
    <Badge label="مرفوض" variant="danger" dot {...p} />
  ),
  Lowest: (p?: Partial<BadgeProps>) => (
    <Badge label="الأقل سعراً" variant="success" {...p} />
  ),
  Highest: (p?: Partial<BadgeProps>) => (
    <Badge label="الأعلى سعراً" variant="danger" {...p} />
  ),
  Open: (p?: Partial<BadgeProps>) => (
    <Badge label="مفتوح" variant="info" dot {...p} />
  ),
  Direct: (p?: Partial<BadgeProps>) => (
    <Badge label="مباشر" variant="purple" dot {...p} />
  ),
};
