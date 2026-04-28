/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ['Orbitron', 'monospace'],
        sarabun: ['Sarabun', 'sans-serif'],
      },
      colors: {
        space: {
          900: '#000814',
          800: '#001028',
          700: '#001840',
        },
        neon: {
          blue:   '#00ccff',
          cyan:   '#00ffff',
          orange: '#ff6600',
          yellow: '#ffcc00',
          green:  '#00ff88',
          pink:   '#ff4488',
          purple: '#cc44ff',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'flicker': 'flicker 0.4s ease-in-out infinite',
        'float-up': 'floatUp 0.6s ease-out forwards',
        'boss-warn': 'bossWarn 0.4s ease-in-out infinite alternate',
        'bounce-in': 'bounceIn 0.4s cubic-bezier(.68,-.55,.27,1.55)',
        'slide-down': 'slideDown 0.35s ease-out',
        'spin-slow': 'spin 4s linear infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'shake': 'shake 0.15s ease-in-out',
        'star-twinkle': 'twinkle 2s ease-in-out infinite',
      },
      keyframes: {
        flicker: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
        floatUp: { from: { opacity: 1, transform: 'translateY(0)' }, to: { opacity: 0, transform: 'translateY(-40px)' } },
        bossWarn: { from: { background: 'rgba(30,0,0,0.85)' }, to: { background: 'rgba(80,0,0,0.95)' } },
        bounceIn: { from: { transform: 'scale(0.6)', opacity: 0 }, to: { transform: 'scale(1)', opacity: 1 } },
        slideDown: { from: { transform: 'translateY(-20px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        glowPulse: { '0%,100%': { boxShadow: '0 0 10px currentColor' }, '50%': { boxShadow: '0 0 30px currentColor, 0 0 60px currentColor' } },
        shake: { '0%,100%': { transform: 'translate(0,0)' }, '25%': { transform: 'translate(-4px,2px)' }, '75%': { transform: 'translate(4px,-2px)' } },
        twinkle: { '0%,100%': { opacity: 0.3 }, '50%': { opacity: 1 } },
      }
    },
  },
  plugins: [],
}
