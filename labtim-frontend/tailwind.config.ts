import type { Config } from "tailwindcss";
const plugin = require('tailwindcss/plugin');

export default {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        "ibm-plex-sans": ["IBM Plex Sans", "sans-serif"],
        "bebas-neue": ["var(--bebas-neue)"],
        'dm-serif': ['"DM Serif Text"', 'serif'],
        'unna': ['Unna', 'serif'],
      },
      colors: {
        'primary-blue-dark': '#001D47', // A deep, rich blue
        'accent-blue-medium': '#2563eb', // Standard Tailwind blue-600, or similar for accent
        'light-blue': '#ADD8E6', // A light blue for contrast on dark backgrounds
        'neutral-light-gray': '#F8F8F8', // A very subtle off-white for backgrounds
        'neutral-dark-gray': '#374151', // A dark gray for body text (Tailwind gray-700)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        primary: {
          DEFAULT: "#E7C9A5",
          admin: "#25388C",
        },
        green: {
          DEFAULT: "#027A48",
          100: "#ECFDF3",
          400: "#4C7B62",
          500: "#2CC171",
          800: "#027A48",
        },
        red: {
          DEFAULT: "#EF3A4B",
          400: "#F46F70",
          500: "#E27233",
          800: "#EF3A4B",
        },
        blue: {
          100: "#0089F1",
        },
        light: {
          100: "#D6E0FF",
          200: "#EED1AC",
          300: "#F8F8FF",
          400: "#EDF1F1",
          500: "#8D8D8D",
          600: "#F9FAFB",
          700: "#E2E8F0",
          800: "#F8FAFC",
        },
        dark: {
          100: "#16191E",
          200: "#3A354E",
          300: "#232839",
          400: "#1E293B",
          500: "#0F172A",
          600: "#333C5C",
          700: "#464F6F",
          800: "#1E2230",
        },
        gray: {
          100: "#CBD5E1",
        },
      },
      screens: {
        xs: "480px",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        pattern: "url('/images/pattern.webp')",
      },
      // Add transform utilities explicitly
      scale: {
        '102': '1.02',
        '103': '1.03',
        '105': '1.05',
        '107': '1.07',
        '110': '1.10',
        '115': '1.15',
      },
      translate: {
        '0.5': '0.125rem',
        '1.5': '0.375rem',
      },
      transitionProperty: {
        'transform': 'transform',
        'all': 'all',
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
        '300': '300ms',
      },
      transitionTimingFunction: {
        'out': 'cubic-bezier(0, 0, 0.2, 1)',
        'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      animation: {
        shine: 'shine 8s linear infinite',
      },
      keyframes: {
        shine: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      backgroundSize: {
        '200%': '200%',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  // require('@tailwindcss/line-clamp'), // Removed as it's included by default in Tailwind v3.3+
        require('@tailwindcss/aspect-ratio'), // <-- ADD THIS LINE
  plugin(function({ addVariant }: { addVariant: (name: string, fn: ({ modifySelectors, separator }: { modifySelectors: (params: { className: string }) => string, separator: string }) => void) => void }) {
    addVariant('custom-hover', ({ modifySelectors, separator }) => {
  modifySelectors({ className: `${separator}custom-hover:hover` });
    });
  }),
  function({ addUtilities }: { addUtilities: (utilities: object, options?: object) => void }) {
      addUtilities({
        '.transform-gpu': {
          transform: 'translate3d(0, 0, 0)',
        },
      })
    }
  ],
} satisfies Config;