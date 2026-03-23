import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#09111f",
        mist: "#f4f7fb",
        accent: "#2dd4bf",
        glow: "#7dd3fc",
      },
      boxShadow: {
        soft: "0 30px 80px rgba(9, 17, 31, 0.12)",
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top, rgba(125, 211, 252, 0.22), transparent 35%), linear-gradient(135deg, rgba(45, 212, 191, 0.1), transparent 60%)",
      },
      fontFamily: {
        sans: ["var(--font-body)", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
