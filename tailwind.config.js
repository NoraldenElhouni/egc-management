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
        primary: "#3b82f6", // A specific hex code for a blue
        secondary: "#ecc94b", // A specific hex code for a yellow
      },
    },
  },
  plugins: [],
};
