import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef9ff",
          100: "#d8f1ff",
          200: "#b9e7ff",
          300: "#89d9ff",
          400: "#52c1ff",
          500: "#2aa3ff",
          600: "#1485f7",
          700: "#0d6de3",
          800: "#1158b8",
          900: "#144b91",
          950: "#112f58",
        },
        surface: {
          900: "#0b0e14",
          800: "#111720",
          700: "#171d2b",
          600: "#1e2636",
          500: "#2a3347",
        },
      },
    },
  },
  plugins: [],
};

export default config;
