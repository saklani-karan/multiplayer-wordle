/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                brown: {
                    50: "#fdf8f6",
                    100: "#f2e8e5",
                    200: "#eaddd7",
                    300: "#e0cec7",
                    400: "#d2bab0",
                    500: "#bfa094",
                    600: "#a18072",
                    700: "#977669",
                    800: "#846358",
                    900: "#43302b",
                },
                secondary: "#383838",
                primary: "#413F42",
                correct: "#B6E2A1",
                close: "#FFEBB4",
                banner: "#f7f5eb",
            },
            screens: {
                // adding xs to the rest
                xs: "300px",
            },
            fontFamily: {
                display: ["Satisfy", "cursive"],
                roboto: ["Roboto", "Arial"],
                montserrat: ['Montserrat', "sans-serif"],
                raleway: ['Raleway', "sans-serif"]
            },
        },
    },
    plugins: [],
};
