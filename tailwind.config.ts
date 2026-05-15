import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        primary: { DEFAULT: "#1d4ed8", light: "#3b82f6", dark: "#1e3a8a" },
        accent: "#06b6d4",
        surface: { DEFAULT: "#f8fafc", 2: "#f1f5f9" },
      },
      borderRadius: {
        xl: "12px", "2xl": "16px", "3xl": "20px",
      },
      boxShadow: {
        sm: "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.08)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)",
        card: "0 0 0 1px rgb(0 0 0 / 0.04), 0 2px 8px rgb(0 0 0 / 0.06)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
