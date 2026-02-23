/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'basket-orange': '#FF6B00',
        'court-green': '#2D6A4F',
        'court-blue': '#1B4965',
      }
    },
  },
  plugins: [],
}