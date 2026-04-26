/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "var(--accent)",
        accent2: "var(--accent2)",
        bg: "var(--bg)",
        surface: "var(--surface)",
        text1: "var(--text1)",
        text2: "var(--text2)",
        text3: "var(--text3)",
        border: "var(--border)",
        green: "var(--green)",
        red: "var(--red)",
        amber: "var(--amber)"
      }
    },
  },
  plugins: [],
}
