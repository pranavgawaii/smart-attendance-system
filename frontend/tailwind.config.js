/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                // OVERRIDE Primary to standard Zinc/Black for strict monochrome
                primary: {
                    50: '#fafafa',  // zinc-50
                    100: '#f4f4f5', // zinc-100
                    200: '#e4e4e7', // zinc-200
                    300: '#d4d4d8', // zinc-300
                    400: '#a1a1aa', // zinc-400
                    500: '#71717a', // zinc-500
                    600: '#52525b', // zinc-600
                    700: '#3f3f46', // zinc-700
                    800: '#27272a', // zinc-800
                    900: '#18181b', // zinc-900 (Main Black)
                    950: '#09090b', // zinc-950
                },
                // Add explicit zinc alias if needed but usually standard palette is enough
            },
            boxShadow: {
                'card': '0 2px 8px rgba(0,0,0,0.02)',
                'card-hover': '0 4px 12px rgba(0,0,0,0.05)',
            }
        },
    },
    plugins: [
        function ({ addUtilities }) {
            addUtilities({
                '.no-scrollbar': {
                    '-ms-overflow-style': 'none',
                    'scrollbar-width': 'none',
                },
                '.no-scrollbar::-webkit-scrollbar': {
                    'display': 'none',
                },
            })
        }
    ],
}
