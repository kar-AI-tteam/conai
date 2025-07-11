/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        dark: {
          bg: '#111827',
          surface: '#1F2937',
          border: '#374151',
          text: {
            primary: '#F9FAFB',
            secondary: '#D1D5DB',
            tertiary: '#9CA3AF'
          }
        }
      },
      typography: {
        DEFAULT: {
          css: {
            pre: {
              padding: '1rem',
              borderRadius: '0.5rem',
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              color: '#1F2937',
              code: {
                backgroundColor: 'transparent',
                padding: '0',
                color: 'inherit',
                fontSize: 'inherit',
              },
            },
            code: {
              backgroundColor: '#F3F4F6',
              padding: '0.25rem',
              borderRadius: '0.25rem',
              color: '#1F2937',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};