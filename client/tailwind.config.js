/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#faf5ec',
          100: '#f4ead9',
          200: '#e9dcc4',
          300: '#d4c2a3',
          400: '#b59c77',
          500: '#8d7351',
          600: '#6c563b',
          700: '#51412e',
          800: '#382e23',
          900: '#292219',
          950: '#0c0a09',
        },
        secondary: {
          50: '#fff2ef',
          100: '#fbe0dc',
          200: '#f2c3bd',
          300: '#f2a7a0',
          400: '#e78b84',
          500: '#d76d67',
          600: '#b95550',
          700: '#954440',
          800: '#783a37',
          900: '#633332',
        },
        accent: {
          50: '#eef8f2',
          100: '#d8eee2',
          200: '#b8dfca',
          300: '#9cc9b5',
          400: '#7eb69d',
          500: '#609b80',
          600: '#4b7d67',
          700: '#3c6454',
          800: '#335246',
          900: '#2b443b',
        },
        scrapbook: { kraft: '#e9dcc4', pink: '#f2a7a0', mint: '#9cc9b5', yellow: '#f8df83', ink: '#554a3b', paper: '#fffaf1' },
        surface: {
          light: '#ffffff',
          dark: '#292524',
        },
        background: {
          light: '#e9dcc4',
          dark: '#332b22',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        note: ['Caveat', 'cursive'],
        typewriter: ['Special Elite', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'soft': '0 1px 2px rgba(15, 23, 42, 0.05), 0 8px 24px -12px rgba(15, 23, 42, 0.12)',
        'card': '0 12px 32px -16px rgba(15, 23, 42, 0.18)',
        'modal': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      borderRadius: {
        'xl': '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      }
    },
  },
  plugins: [],
}
