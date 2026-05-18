/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'deep': '#0B0F1A',
        'surface': '#131929',
        'glass': 'rgba(255,255,255,0.05)',
        'neon-teal': '#00F5D4',
        'neon-amber': '#FFB830',
        'neon-pink': '#FF4D8D',
        'primary': '#E8EDF5',
        'muted': '#6B7A99',
        'map-overlay': 'rgba(11,15,26,0.6)',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'sonar-ping': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
}
