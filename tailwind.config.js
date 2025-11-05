/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'acp-blue': '#2E5077',
        'acp-red': '#8B3A3A',
      },
    },
  },
  plugins: [],
}