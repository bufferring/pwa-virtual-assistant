/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body: ['"Outfit"', 'sans-serif'],
      },
      colors: {
        surface: {
          900: '#0a0e1a',
          800: '#0f1425',
          700: '#161c30',
          600: '#1e253c',
        },
        accent: {
          DEFAULT: '#00e5c8',
          dim: '#00b89e',
          glow: '#00ffd5',
        },
        muted: '#6b7a99',
      },
      animation: {
        'pulse-ring': 'pulseRing 3s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'shimmer': 'shimmer 2.5s ease-in-out infinite',
      },
      keyframes: {
        pulseRing: {
          '0%, 100%': { opacity: '0.15', transform: 'scale(1)' },
          '50%': { opacity: '0.35', transform: 'scale(1.08)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%, 100%': { backgroundPosition: '-200% center' },
          '50%': { backgroundPosition: '200% center' },
        },
      },
    },
  },
  plugins: [],
}
