/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#14171F",      // Deep architectural ink
        "primary-light": "#1E232F",
        accent: "#9A3412",       // Warm terracotta / deep ochre (>4.5:1 contrast)
        "accent-dark": "#7C2D12",
        "accent-light": "#FFF7ED",
        background: "#FBF9F5",   // Calming warm sand/linen
        surface: "#FFFFFF",      // Crisp card surface
        "surface-raised": "#F4F0E8", // Raised neutral
        hairline: "rgba(31, 27, 22, 0.08)",
        ink: {
          primary: "#1F1B16",    // High-contrast primary reading
          secondary: "#5E554A",  // Secondary descriptive
          muted: "#8C8275",      // Meta & quiet captions
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
      },
      borderRadius: {
        'card': '14px',
        'control': '8px',
        'tag': '4px',
      },
      boxShadow: {
        'subtle': '0 1px 2px rgba(31, 27, 22, 0.04)',
        'elevated': '0 4px 16px -2px rgba(31, 27, 22, 0.06)',
      },
    },
  },
  plugins: [],
}
