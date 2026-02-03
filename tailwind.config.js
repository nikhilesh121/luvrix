/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1e3a5f",
        secondary: "#0f2942",
        accent: "#3b82f6",
        darkblue: {
          50: "#e6f0ff",
          100: "#cce0ff",
          200: "#99c2ff",
          300: "#66a3ff",
          400: "#3385ff",
          500: "#1e3a5f",
          600: "#193352",
          700: "#142b45",
          800: "#0f2338",
          900: "#0a1c2b",
        },
      },
    },
  },
  plugins: [],
};
