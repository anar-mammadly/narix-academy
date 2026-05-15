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
        primary: { DEFAULT: "#2563eb", hover: "#1d4ed8", light: "#eff6ff" },
        accent: "#06b6d4",
        surface: { DEFAULT: "#f8fafc", 2: "#f1f5f9" },
      },
      borderRadius: {
        xl: "14px", "2xl": "18px", "3xl": "24px",
      },
      boxShadow: {
        card: "0 1px 3px rgb(0 0 0 / 0.06), 0 1px 2px rgb(0 0 0 / 0.04)",
        lg: "0 8px 24px rgb(0 0 0 / 0.08), 0 2px 8px rgb(0 0 0 / 0.04)",
        xl: "0 20px 60px rgb(0 0 0 / 0.1), 0 1px 3px rgb(0 0 0 / 0.05)",
      },
      screens: {
        xs: "375px",
      },
      keyframes: {
        progressFill: {
          from: { width: "0" },
        },
      },
      animation: {
        "progress-fill": "progressFill 1.5s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
