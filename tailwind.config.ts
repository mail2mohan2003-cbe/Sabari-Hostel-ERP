import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        maroon: "#7a1f2b",
        cream: "#f4efe6",
      },
    },
  },
  plugins: [],
};
export default config;
