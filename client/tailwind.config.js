module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary Colors
        gray: {
          750: '#2D3748',
          800: '#1F2937',
          900: '#111827',
        },
        // Accent Colors
        yellow: {
          300: '#FDE68A',
          400: '#FCD34D',
        },
        purple: {
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          900: '#4C1D95',
        },
        blue: {
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          900: '#1E3A8A',
        },
        green: {
          500: '#10B981',
        },
        orange: {
          500: '#F59E0B',
        },
        pink: {
          500: '#EC4899',
        },
        cyan: {
          400: '#22D3EE',
        },
        // Custom background colors
        bg1: '#111111',
        bg2: '#1a1a1a',
        bg3: '#2d2d2d',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
}
