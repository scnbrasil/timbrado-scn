/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        scn: {
          blue: '#005498',
          'blue-dark': '#003d70',
          'blue-light': '#0070cc',
          purple: '#8B0A7E',
          'purple-light': '#b0169f',
        },
      },
      textWrap: {
        balance: 'balance',
      },
    },
  },
  plugins: [],
};
