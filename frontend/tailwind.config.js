/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── Teal CMC — extrait du logo ── */
        primary: {
          50:  '#f0fafe',
          100: '#d9f3fb',
          200: '#b0e7f6',
          300: '#72d4ee',
          400: '#30b9e4',
          500: '#0baac6',   // teal logo CMC
          600: '#0990ab',
          700: '#0b748a',
          800: '#0e5f72',
          900: '#104e60',
          950: '#073240',
        },
        accent: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        warm: {
          50:  '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
        sidebar: {
          bg:      '#071e28',
          surface: '#0c3040',
          hover:   '#104e60',
          border:  '#0e5f72',
          text:    '#72d4ee',
          muted:   '#30b9e4',
        },
      },
      fontFamily: {
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Sora', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':   'fadeIn 0.45s ease-out',
        'slide-up':  'slideUp 0.4s ease-out',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(18px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      boxShadow: {
        'card':          '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)',
        'card-hover':    '0 4px 8px rgba(0,0,0,0.07), 0 16px 32px rgba(0,0,0,0.07)',
        'sidebar':       '4px 0 28px rgba(0,0,0,0.25)',
        'glow-teal':     '0 0 20px rgba(11,170,198,0.3)',
        'glow-accent':   '0 0 16px rgba(245,158,11,0.3)',
        'input':         '0 1px 2px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
}
