/** @type {import('tailwindcss').Config} */
module.exports = {
  // include all files under src so Tailwind can scan JSX/TSX files for class names
  content: [
    "./index.html",
    "./src/**/*.{html,js,ts,jsx,tsx}",
    "./src/**/**/*.{html,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* 🎨 Core Semantic Colors */
        primary: "#2563eb", // blue-600
        secondary: "#64748b", // slate-500
        accent: "#06b6d4", // cyan-500
        muted: "#f1f5f9", // slate-100
        background: "#f8fafc", // slate-50
        foreground: "#0f172a", // slate-900
        border: "#e2e8f0", // slate-200

        /* ✅ State Colors */
        success: {
          DEFAULT: "#16a34a", // green-600
          light: "#22c55e", // green-500
          dark: "#15803d", // green-700
          foreground: "#ffffff",
        },
        warning: {
          DEFAULT: "#eab308", // yellow-500
          light: "#facc15", // yellow-400
          dark: "#ca8a04", // yellow-600
          foreground: "#000000",
        },
        error: {
          DEFAULT: "#dc2626", // red-600
          light: "#ef4444", // red-500
          dark: "#b91c1c", // red-700
          foreground: "#ffffff",
        },
        info: {
          DEFAULT: "#0ea5e9", // sky-500
          light: "#38bdf8", // sky-400
          dark: "#0284c7", // sky-600
          foreground: "#ffffff",
        },
      },
    },
  },
  plugins: [],
};
