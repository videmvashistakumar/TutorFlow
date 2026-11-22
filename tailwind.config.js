/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: {
          50: 'rgb(var(--accent-50) / <alpha-value>)',
          100: 'rgb(var(--accent-100) / <alpha-value>)',
          200: 'rgb(var(--accent-200) / <alpha-value>)',
          300: 'rgb(var(--accent-300) / <alpha-value>)',
          400: 'rgb(var(--accent-400) / <alpha-value>)',
          500: 'rgb(var(--accent-500) / <alpha-value>)',
          600: 'rgb(var(--accent-600) / <alpha-value>)',
          700: 'rgb(var(--accent-700) / <alpha-value>)',
          800: 'rgb(var(--accent-800) / <alpha-value>)',
          900: 'rgb(var(--accent-900) / <alpha-value>)',
        },
        navy: {
          50: '#f3f5f9',
          100: '#e3e8f0',
          200: '#cdd5e1',
          300: '#a9b5c8',
          400: '#7d8ca5',
          500: '#46556f',
          600: '#2b3d5e',
          700: '#1f2d47',
          800: '#18233a',
          900: '#111a2d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(17, 26, 45, 0.04), 0 1px 3px 0 rgba(17, 26, 45, 0.06)',
        'card-hover': '0 6px 16px -4px rgba(17, 26, 45, 0.10), 0 2px 4px -1px rgba(17, 26, 45, 0.05)',
        dropdown: '0 16px 40px -8px rgba(17, 26, 45, 0.18), 0 4px 10px -2px rgba(17, 26, 45, 0.08)',
      },
    },
  },
  plugins: [],
}
