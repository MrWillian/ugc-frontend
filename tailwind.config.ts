import type { Config } from "tailwindcss";

/**
 * Tailwind CSS v4 uses PostCSS (`@tailwindcss/postcss`) as the primary config.
 * This file exists for tooling compatibility (e.g. shadcn/ui content paths).
 */
const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
