/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        muted: "#667085",
        line: "#D0D5DD",
        panel: "#F7F8FA",
        brand: "#2563EB",
        accent: "#14B8A6",
        coral: "#F97316"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(16, 24, 40, 0.08)",
        lift: "0 18px 60px rgba(15, 23, 42, 0.12)"
      }
    }
  },
  plugins: []
};
