import React from "react";

const LoadingSpinner: React.FC<{ size?: string; label?: string }> = ({
  size = "24",
  label = "Loading...",
}) => {
  const srStyle: React.CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    border: 0,
  };

  const svgStyle: React.CSSProperties = {
    display: "block",
    animation: "egc-spinner-spin 1s linear infinite",
    color: "currentColor",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        position: "relative",
      }}
    >
      <svg
        className={
          size === "sm"
            ? "w-4 h-4"
            : size === "md"
              ? "w-6 h-6"
              : size === "lg"
                ? "w-8 h-8"
                : "w-10 h-10"
        }
        viewBox="0 0 50 50"
        style={svgStyle}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeOpacity="0.2"
        />
        <path fill="currentColor" d="M45 25c0-11.046-8.954-20-20-20" />
      </svg>

      <span style={srStyle}>{label}</span>

      <style>{`
                @keyframes egc-spinner-spin {
                    100% { transform: rotate(360deg); }
                }
            `}</style>
    </div>
  );
};

export default LoadingSpinner;
