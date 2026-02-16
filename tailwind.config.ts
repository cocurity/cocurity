import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      boxShadow: {
        glow: "0 0 30px rgba(124,58,237,0.35)",
        glass: "0 10px 30px rgba(0,0,0,0.35)",
      },
      backdropBlur: {
        xl: "24px",
      },
    },
  },
  plugins: [],
};

export default config;
