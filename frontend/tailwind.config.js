export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50:'#eff6ff', 100:'#dbeafe', 500:'#1d4ed8', 600:'#1e40af', 700:'#1e3a8a' },
        legal: { dark:'#1a2b4a', mid:'#2d4a7a', light:'#4a7cb5' }
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] }
    }
  },
  plugins: []
}
