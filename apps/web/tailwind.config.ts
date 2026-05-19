import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
    "../../packages/shared/src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "ui-sans-serif", "system-ui"]
      },
      colors: {
        origin: {
          cyan: "#67e8f9",
          green: "#86efac",
          ink: "#050506",
          panel: "#0b0f14"
        }
      },
      boxShadow: {
        glow: "0 0 40px rgba(103, 232, 249, 0.22)"
      },
      backgroundImage: {
        "radial-grid":
          "radial-gradient(circle at 50% 0%, rgba(103,232,249,0.18), transparent 36%), linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)"
      }
    }
  },
  plugins: [typography]
};

export default config;
