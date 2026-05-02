const { resolve } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    resolve(__dirname, '../../apps/web/**/*.{js,ts,jsx,tsx,mdx}'),
    resolve(__dirname, '../../packages/ui/**/*.{js,ts,jsx,tsx,mdx}'),
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
