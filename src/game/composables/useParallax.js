import { VW, VH } from '../constants.js'
import { state } from '../state.js'
import { getTier } from '../difficulty.js'
import { level } from '../store.js'

const LAYER_CFG = [
  { count: 55, speed: 0.22, size: 0.45, alpha: 0.28, drift: 0.004, twinkle: false },
  { count: 42, speed: 0.55, size: 0.85, alpha: 0.48, drift: 0.012, twinkle: true  },
  { count: 26, speed: 1.1,  size: 1.45, alpha: 0.70, drift: 0.028, twinkle: true  },
  { count: 12, speed: 2.1,  size: 2.4,  alpha: 0.90, drift: 0.055, twinkle: true  },
  { count: 5,  speed: 3.4,  size: 3.8,  alpha: 1.00, drift: 0.095, twinkle: false },
]
const NEBULA_COLS = ['#2244aa','#441166','#113355','#331144','#114433','#221133']

export function useParallax() {
  function init() {
    const layers = LAYER_CFG.map(cfg => {
      const stars = []
      for (let i = 0; i < cfg.count; i++) {
        stars.push({ x: Math.random() * VW, y: Math.random() * VH, t: Math.random() * Math.PI * 2, gt: Math.random() * Math.PI * 2 })
      }
      return { ...cfg, stars, xOff: 0 }
    })
    const nebulae = NEBULA_COLS.map(col => ({
      x: Math.random() * VW, y: Math.random() * VH,
      r: 160 + Math.random() * 180,
      vx: (Math.random() - 0.5) * 0.06,
      vy: 0.04 + Math.random() * 0.06,
      col, a: 0.025 + Math.random() * 0.03, xOff: 0,
    }))
    state.px = { layers, nebulae, shootingStars: [], shootTimer: 180 + Math.random() * 300 }
  }

  function update(dt) {
    const targetX = state.player ? (state.player.x - VW / 2) : 0
    for (const n of state.px.nebulae) {
      n.xOff += (targetX * 0.003 - n.xOff) * 0.02
      n.x += n.vx + n.xOff * 0.001; n.y += n.vy
      if (n.x < -n.r * 1.5) n.x = VW + n.r
      if (n.x > VW + n.r * 1.5) n.x = -n.r
      if (n.y > VH + n.r) { n.y = -n.r; n.x = Math.random() * VW }
    }
    for (const layer of state.px.layers) {
      layer.xOff += (targetX * layer.drift - layer.xOff) * 0.06
      for (const s of layer.stars) {
        s.y += layer.speed; s.t += 0.025; s.gt += 0.018
        if (s.y > VH + 4) { s.y = -4; s.x = Math.random() * VW }
      }
    }
    state.px.shootTimer -= dt
    if (state.px.shootTimer <= 0) {
      state.px.shootTimer = 220 + Math.random() * 480
      const fromLeft = Math.random() < 0.5
      const angle = (Math.PI * 0.18) + Math.random() * (Math.PI * 0.14)
      const spd   = 9 + Math.random() * 7
      state.px.shootingStars.push({
        x: fromLeft ? -20 : VW + 20, y: 20 + Math.random() * VH * 0.55,
        vx: (fromLeft ? 1 : -1) * Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 55 + Math.random() * 35, maxLife: 90, len: 40 + Math.random() * 50,
      })
    }
    for (const ss of state.px.shootingStars) { ss.x += ss.vx; ss.y += ss.vy; ss.life-- }
    state.px.shootingStars = state.px.shootingStars.filter(ss => ss.life > 0)
  }

  function draw(c) {
    const tierCol = getTier(level.value).color
    for (const n of state.px.nebulae) {
      c.globalAlpha = n.a
      const g = c.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r)
      g.addColorStop(0, n.col); g.addColorStop(0.5, n.col + '66'); g.addColorStop(1, 'transparent')
      c.fillStyle = g; c.fillRect(0, 0, VW, VH)
    }
    c.globalAlpha = 0.032
    const tg = c.createRadialGradient(VW * 0.65, VH * 0.3, 0, VW * 0.65, VH * 0.3, VW * 0.55)
    tg.addColorStop(0, tierCol); tg.addColorStop(1, 'transparent')
    c.fillStyle = tg; c.fillRect(0, 0, VW, VH)
    c.globalAlpha = 1

    for (let li = 0; li < state.px.layers.length; li++) {
      const layer = state.px.layers[li]
      for (const s of layer.stars) {
        const sx = ((s.x + layer.xOff) % VW + VW) % VW
        const a  = layer.twinkle ? layer.alpha * (0.45 + 0.55 * Math.sin(s.t)) : layer.alpha
        c.globalAlpha = a
        c.fillStyle = '#ffffff'
        c.beginPath(); c.arc(sx, s.y, layer.size, 0, Math.PI * 2); c.fill()
        if (li === 4) {
          const ga = 0.35 * Math.pow(Math.max(0, Math.sin(s.gt)), 6)
          if (ga > 0.01) {
            c.globalAlpha = ga
            const gl = layer.size * 3.5
            c.strokeStyle = '#ffffff'; c.lineWidth = 0.8
            c.beginPath()
            c.moveTo(sx - gl, s.y); c.lineTo(sx + gl, s.y)
            c.moveTo(sx, s.y - gl); c.lineTo(sx, s.y + gl)
            c.stroke()
          }
        }
      }
    }
    c.globalAlpha = 1

    for (const ss of state.px.shootingStars) {
      const t = ss.life / ss.maxLife
      c.save()
      c.translate(ss.x, ss.y)
      c.rotate(Math.atan2(ss.vy, ss.vx))
      const sg = c.createLinearGradient(-ss.len, 0, 0, 0)
      sg.addColorStop(0, 'rgba(255,255,255,0)')
      sg.addColorStop(0.6, `rgba(200,230,255,${t * 0.2})`)
      sg.addColorStop(1, `rgba(255,255,255,${t * 0.5})`)
      c.strokeStyle = sg; c.lineWidth = 1.5
      c.beginPath(); c.moveTo(-ss.len, 0); c.lineTo(0, 0); c.stroke()
      c.globalAlpha = Math.min(1, t * 3)
      c.fillStyle = '#ffffff'
      c.beginPath(); c.arc(0, 0, 1.5, 0, Math.PI * 2); c.fill()
      c.restore()
    }
    c.globalAlpha = 1
  }

  return { init, update, draw }
}
