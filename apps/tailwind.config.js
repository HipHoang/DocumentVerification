/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          light: "#FDCB58",
          DEFAULT: "#D4AF37",
          dark: "#AA8507",
        },
        darkBg: "#0B0B0B",
        darkCard: "#161616",
        primary: "#002B5B",
      },
    },
  },
  plugins: [],
};