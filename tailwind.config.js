/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cabin: {
          dark: '#0a0e1a',
          panel: '#121821',
          accent: '#3b82f6',
          gold: '#f59e0b',
          dim: '#1e293b',
          border: 'rgba(255,255,255,0.06)',
        },
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'soft': '0 2px 12px rgba(0,0,0,0.3)',
        'panel': '0 8px 32px rgba(0,0,0,0.3)',
        'glow': '0 0 24px rgba(59,130,246,0.15)',
        'glow-gold': '0 0 24px rgba(245,158,11,0.15)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shine': 'shine 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shine: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
