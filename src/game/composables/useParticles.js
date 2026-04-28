import { state } from '../state.js'

export function useParticles() {
  function burst(x, y, color, n = 14, spd = 4, big = false) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const s = spd * (0.4 + Math.random() * 0.8)
      state.particles.push({
        x, y,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        color,
        size: big ? 3 + Math.random() * 4 : 1.5 + Math.random() * 3,
        life: 45 + Math.random() * 30, maxLife: 75,
        dead: false,
      })
    }
  }

  function addFloat(x, y, text, color = '#ffff88') {
    state.floats.push({ x, y, text, color, life: 55, maxLife: 55, vy: -1.2, dead: false })
  }

  function sparkAt(x, y, color, n = 4) {
    for (let i = 0; i < n; i++) {
      state.particles.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        color, size: 2, life: 14, maxLife: 14, dead: false,
      })
    }
  }

  function updateParticles() {
    for (const p of state.particles) {
      p.x += p.vx; p.y += p.vy
      p.vy += 0.07; p.vx *= 0.97
      p.life--
      if (p.life <= 0) p.dead = true
    }
    for (const f of state.floats) {
      f.y += f.vy; f.life--
      if (f.life <= 0) f.dead = true
    }
    state.particles = state.particles.filter(p => !p.dead)
    state.floats    = state.floats.filter(f => !f.dead)
  }

  return { burst, addFloat, sparkAt, updateParticles }
}
