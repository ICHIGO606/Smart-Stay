/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0A192F",    // Deep Navy
        accent: "#D4AF37",     // Gold
        background: "#F5F5F5", // Off-white
        text: "#333333",       // Dark Gray
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}