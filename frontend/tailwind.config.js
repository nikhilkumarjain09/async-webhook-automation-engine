/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#ebefff',
          200: '#dce3ff',
          300: '#c2cdff',
          400: '#9eacff',
          500: '#7382fc',
          600: '#545df5',
          700: '#4045e0',
          800: '#353abc',
          900: '#2f3296',
          950: '#1d1e5c',
        },
      },
    },
  },
  plugins: [],
}
