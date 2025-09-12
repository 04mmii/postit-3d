/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        postit: {
          yellow: "#FFEB74",
          pink: "#FFC3D1",
          mint: "#BFF3E0",
          cork: "#E5D0A6",
          frame: "#b58b52",
        },
      },
      boxShadow: {
        card: "0 12px 30px rgba(0,0,0,.25)",
        board: "inset 0 30px 80px rgba(0,0,0,.25), 0 10px 40px rgba(0,0,0,.15)",
      },
      borderRadius: { card: "10px", board: "24px" },
    },
  },
  safelist: [
    "bg-postit-yellow",
    "bg-postit-pink",
    "bg-postit-mint",
    "text-black",
    "text-white",
  ],
  plugins: [],
};
