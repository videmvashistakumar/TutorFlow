/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
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
