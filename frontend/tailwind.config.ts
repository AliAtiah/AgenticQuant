import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#e8f0ff",
          100: "#d4e4ff",
          200: "#b1ccff",
          300: "#82a8ff",
          400: "#5b8bff",
          500: "#2962FF",
          600: "#1E53E5",
          700: "#1544c2",
          800: "#14399e",
          900: "#16337d",
          950: "#101f4d",
        },
        surface: {
          900: "#131722",
          800: "#1E222D",
          700: "#2A2E39",
          600: "#363A45",
          500: "#4A4E59",
          400: "#787B86",
          300: "#9598A1",
          200: "#B2B5BE",
          100: "#D1D4DC",
        },
      },
      fontFamily: {
        mono: ["SF Mono", "Monaco", "Inconsolata", "Fira Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
