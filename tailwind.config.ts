import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // TAMU maroon-flavored palette (rename freely once you have branding)
        brand: {
          DEFAULT: "#500000",
          light: "#7a2020",
          dark: "#360000",
        },
        maroon: {
          50:  "#fdf2f2",
          100: "#fce7e7",
          200: "#f8c9c9",
          700: "#500000",
          800: "#360000",
        },
      },
    },
  },
  plugins: [],
};

export default config;
