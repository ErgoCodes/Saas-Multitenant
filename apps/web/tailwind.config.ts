import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          50: 'hsl(var(--accent-shim-50))',
          100: 'hsl(var(--accent-shim-100))',
          200: 'hsl(var(--accent-shim-200))',
          300: 'hsl(var(--accent-shim-300))',
          400: 'hsl(var(--accent-shim-400))',
          500: 'hsl(var(--accent-shim-500))',
          600: 'hsl(var(--accent-shim-600))',
          700: 'hsl(var(--accent-shim-700))',
          800: 'hsl(var(--accent-shim-800))',
          900: 'hsl(var(--accent-shim-900))',
          950: 'hsl(var(--accent-shim-950))',
        },
        surface: {
          50: 'hsl(var(--surface-50))',
          100: 'hsl(var(--surface-100))',
          200: 'hsl(var(--surface-200))',
          300: 'hsl(var(--surface-300))',
          400: 'hsl(var(--surface-400))',
          500: 'hsl(var(--surface-500))',
          600: 'hsl(var(--surface-600))',
          700: 'hsl(var(--surface-700))',
          800: 'hsl(var(--surface-800))',
          900: 'hsl(var(--surface-900))',
          950: 'hsl(var(--surface-950))',
        },
        brand: {
          50: 'hsl(var(--brand-50))',
          100: 'hsl(var(--brand-100))',
          200: 'hsl(var(--brand-200))',
          400: 'hsl(var(--brand-400))',
          500: 'hsl(var(--brand-500))',
          600: 'hsl(var(--brand-600))',
          700: 'hsl(var(--brand-700))',
          800: 'hsl(var(--brand-800))',
          900: 'hsl(var(--brand-900))',
        },
        success: {
          50: 'hsl(var(--success-50))',
          100: 'hsl(var(--success-100))',
          400: 'hsl(var(--success-400))',
          500: 'hsl(var(--success-500))',
          600: 'hsl(var(--success-600))',
          700: 'hsl(var(--success-700))',
        },
        danger: {
          50: 'hsl(var(--danger-50))',
          100: 'hsl(var(--danger-100))',
          400: 'hsl(var(--danger-400))',
          500: 'hsl(var(--danger-500))',
          600: 'hsl(var(--danger-600))',
          700: 'hsl(var(--danger-700))',
        },
      },
      boxShadow: {
        soft: '0 1px 3px 0 rgb(0 0 0 / 0.03), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        card: '0 1px 4px 0 rgb(0 0 0 / 0.04), 0 2px 8px -1px rgb(0 0 0 / 0.06)',
        elevated: '0 4px 16px -2px rgb(0 0 0 / 0.08), 0 2px 8px -1px rgb(0 0 0 / 0.04)',
        modal: '0 20px 60px -12px rgb(0 0 0 / 0.25), 0 8px 24px -4px rgb(0 0 0 / 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
