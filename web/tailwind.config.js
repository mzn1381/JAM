/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        admin: {
          accent: '#00B3A6',
          'accent-light': '#57F1E7',
          sidebar: '#1D2430',
          'sidebar-foreground': '#CBD5E1',
          bg: '#F0F2F9',
          border: '#E3E8EF',
          'border-strong': '#D4DBE5',
          ink: '#1D2430',
          muted: '#7E8799',
        },
      },
      boxShadow: {
        'admin-card': '0 14px 26px -20px rgba(29, 36, 48, 0.18)',
      },
    },
  },
  plugins: [],
}
