/** @type {import('tailwindcss').Config} */
import animate from "tailwindcss-animate";
import containerQueries from "@tailwindcss/container-queries";

export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Geist integrates perfectly here
        sans: ['var(--font-sans)', 'Geist Sans', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'Geist Mono', 'monospace'],
      },
      colors: {
        // Switching to OKLCH for "Soft" rendering
        border: "oklch(var(--border) / <alpha-value>)",
        input: "oklch(var(--input) / <alpha-value>)",
        ring: "oklch(var(--ring) / <alpha-value>)",
        background: "oklch(var(--background) / <alpha-value>)",
        foreground: "oklch(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "oklch(var(--primary) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground) / <alpha-value>)",
          hover: "oklch(var(--primary-hover) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
          foreground: "oklch(var(--secondary-foreground) / <alpha-value>)",
        },
        // Adding Surface tokens for depth layering
        surface: {
          low: "oklch(var(--surface-low) / <alpha-value>)",
          mod: "oklch(var(--surface-mod) / <alpha-value>)",
          high: "oklch(var(--surface-high) / <alpha-value>)",
        },
        card: {
          DEFAULT: "oklch(var(--card) / <alpha-value>)",
          foreground: "oklch(var(--card-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
        },
      },
      fontSize: {
        // Fluid scales prevent the "jumpy" mobile-to-desktop feel
        "fluid-sm": "clamp(0.8rem, 0.17vw + 0.76rem, 0.89rem)",
        "fluid-base": "clamp(1rem, 0.34vw + 0.91rem, 1.19rem)",
        "fluid-lg": "clamp(1.25rem, 0.61vw + 1.1rem, 1.58rem)",
        "fluid-xl": "clamp(1.56rem, 1vw + 1.31rem, 2.11rem)",
        "fluid-2xl": "clamp(1.95rem, 1.56vw + 1.56rem, 2.81rem)",
        "fluid-display": "clamp(2.44rem, 2.38vw + 1.85rem, 3.75rem)",
      },
      borderRadius: {
        // Softened squircle-radius logic
        sm: "calc(var(--radius) - 4px)",
        md: "calc(var(--radius) - 2px)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 4px)",
        '2xl': "calc(var(--radius) + 12px)",
        '3xl': "calc(var(--radius) + 20px)",
      },
      boxShadow: {
        // Replaced rgba(0,0,0) with OKLCH-based shadows for "cleaner" dark mode
        'soft': '0 2px 10px -2px oklch(0% 0 0 / 0.05)',
        'elevated': '0 10px 30px -10px oklch(0% 0 0 / 0.1)',
        'glass-edge': 'inset 0 1px 1px 0 oklch(100% 0 0 / 0.1)',
        'glow': '0 0 20px -5px oklch(var(--primary) / 0.2)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring-gentle': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        "shimmer": {
          "100%": { transform: "translateX(100%)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        }
      },
      animation: {
        "shimmer": "shimmer 2s infinite",
        "float": "float 5s ease-in-out infinite",
      },
    },
  },
  plugins: [animate, containerQueries],
}
