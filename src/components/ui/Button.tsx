import React from "react";
import LoadingSpinner from "./LoadingSpinner";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?:
    | "primary"
    | "primary-light"
    | "primary-outline"
    | "secondary"
    | "accent"
    | "success"
    | "warning"
    | "error"
    | "info"
    | "ghost"
    | "muted";
  size?: "sm" | "md" | "lg" | "xl" | "xs";
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  loading = false,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  // Use semantic Tailwind color classes that map to your tailwind.config.js keys.
  const variants: Record<string, string> = {
    // primary uses primary.DEFAULT, primary.dark, primary.light, primary.superLight
    primary:
      "bg-primary hover:bg-primary-dark text-white focus:ring-primary-light",

    // a slightly lighter primary (uses primary.light)
    "primary-light":
      "bg-primary-light hover:bg-primary text-white focus:ring-primary-light",

    // outline style referencing primary & primary.superLight for hover bg
    "primary-outline":
      "border-2 border-primary text-primary hover:bg-primary-superLight focus:ring-primary-light",

    // secondary is a single color in your config (string -> class 'bg-secondary')
    secondary:
      "bg-secondary hover:bg-secondary-dark text-white focus:ring-secondary",

    // accent uses accent (string)
    accent: "bg-accent hover:bg-accent-dark text-white focus:ring-accent",

    // success uses nested success.DEFAULT/light/dark and success.foreground for text if desired
    success:
      "bg-success hover:bg-success-dark text-success-foreground focus:ring-success-light",

    // warning uses nested warning colors and warning.foreground
    warning:
      "bg-warning hover:bg-warning-dark text-warning-foreground focus:ring-warning-light",

    // error uses nested error colors and error.foreground
    error:
      "bg-error hover:bg-error-dark text-error-foreground focus:ring-error-light",

    // info uses nested info colors and info.foreground
    info: "bg-info hover:bg-info-dark text-info-foreground focus:ring-info-light",

    // ghost & muted use transparent/background-like colors defined in config
    ghost: "bg-transparent hover:bg-muted text-foreground focus:ring-border",
    muted: "bg-muted hover:bg-border text-foreground focus:ring-border",
  };

  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-sm",
    xs: "px-2 py-1 text-xs",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
    xl: "px-8 py-4 text-xl",
  };

  // Defensive: if someone passes an unknown variant/size, fall back to defaults
  const variantClass = variants[variant] ?? variants["primary"];
  const sizeClass = sizes[size] ?? sizes["md"];

  return (
    <button
      className={`${baseStyles} ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          {children}
          <LoadingSpinner size={size} />
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
