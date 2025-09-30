/** @type {import('tailwindcss').Config} */
export default {
   content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
      display: ["Poppins", "sans-serif"],
    },
    
    extend: {
      // colors used in the project 
      colors: {
        primary: "#05B6D3",
        secoundary:"#EF863E",
      },
    },
  },
  plugins: [],
}

