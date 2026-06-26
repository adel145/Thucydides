import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#010e24",
          900: "#041329",
          850: "#071a33",
          800: "#0a192f",
          750: "#0d1c32",
          700: "#112036",
          650: "#1c2a41",
          600: "#27354c"
        },
        aqua: {
          400: "#64ffda",
          500: "#38debb",
          700: "#00725e"
        },
        ink: {
          100: "#d6e3ff",
          200: "#bacac3",
          400: "#85948e"
        },
        signal: {
          red: "#ffb4ab"
        }
      },
      boxShadow: {
        glow: "0 0 24px rgba(100, 255, 218, 0.16)",
        "glow-strong": "0 0 36px rgba(100, 255, 218, 0.26)"
      },
      fontFamily: {
        sans: ["Inter", "Rubik", "Assistant", "system-ui", "sans-serif"]
      },
      backgroundImage: {
        "radial-scan": "radial-gradient(circle at 20% 20%, rgba(100,255,218,0.14), transparent 28%), radial-gradient(circle at 82% 8%, rgba(188,198,230,0.10), transparent 25%), linear-gradient(135deg, #010e24 0%, #041329 45%, #0a192f 100%)"
      }
    }
  },
  plugins: []
};

export default config;
