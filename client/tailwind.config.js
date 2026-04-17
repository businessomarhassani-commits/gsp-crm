/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cream:  '#F5F4EF',
        navy:   '#1a2332',
        'navy-light': '#243046',
        gold:   '#E8A838',
        'gold-light': '#F5C56A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
