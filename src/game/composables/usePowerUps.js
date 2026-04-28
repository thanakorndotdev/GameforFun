import { state } from '../state.js'
import { activePU, shieldHP, lives } from '../store.js'
import { MAX_LIVES, PU_DUR } from '../constants.js'
import { useParticles } from './useParticles.js'

export const PU_DEFS = [
  { type: 'multi',  icon: '🔫', color: '#ff9900', label: 'MULTI' },
  { type: 'shield', icon: '🛡️', color: '#00aaff', label: 'SHIELD' },
  { type: 'speed',  icon: '⚡', color: '#ffff00', label: 'SPEED' },
  { type: 'life',   icon: '❤️', color: '#ff4488', label: 'LIFE' },
  { type: 'bomb',   icon: '💣', color: '#ff6600', label: 'BOMB' },
]

let puIdCtr = 0

export function usePowerUps() {
  const { burst, addFloat } = useParticles()

  function maybeDropPU(x, y) {
    if (Math.random() > state.dp.puDropRate) return
    const lv = state.dp.waveSize // proxy for level — we don't import level here
    let pool = [...PU_DEFS]
    pool = [...pool, PU_DEFS[0], PU_DEFS[1]]
    const def = pool[Math.floor(Math.random() * pool.length)]
    state.powerups.push({ ...def, x, y, vy: 1.6, angle: 0, w: 26, h: 26, dead: false })
  }

  function dropBossGift(x, y) {
    for (let i = 0; i < 3; i++) {
      const def = PU_DEFS[i % 4]
      setTimeout(() => {
        if (state.player) state.powerups.push({ ...def, x: x + (i - 1) * 45, y: y + 20, vy: 1.5, angle: 0, w: 26, h: 26, dead: false })
      }, i * 180)
    }
  }

  function applyPU(type) {
    state.runPUCollected++
    if (type === 'life') {
      if (lives.value < MAX_LIVES) lives.value++
      addFloat(state.player.x, state.player.y - 40, '+LIFE ❤️', '#ff4488')
      return
    }
    if (type === 'bomb') {
      const cleared = state.enemies.filter(e => e.type !== 'boss').length
      for (const e of state.enemies) {
        if (e.type !== 'boss') { e.dead = true; burst(e.x, e.y, '#ff6600', 8) }
        else e.hp -= 8
      }
      addFloat(state.player.x, state.player.y - 50, `BOOM! ×${cleared}`, '#ff6600')
      return
    }
    const idx = activePU.findIndex(p => p.type === type)
    if (idx !== -1) activePU.splice(idx, 1)
    const id = ++puIdCtr
    const def = PU_DEFS.find(p => p.type === type)
    activePU.push({ id, type, icon: def.icon, color: def.color, label: def.label, t: PU_DUR, max: PU_DUR })
    if (type === 'multi')  state.multiShot = true
    if (type === 'shield') shieldHP.value  = 3
    if (type === 'speed')  state.speedBoost = true
  }

  function tickPU(dt) {
    for (let i = activePU.length - 1; i >= 0; i--) {
      activePU[i].t -= dt
      if (activePU[i].t <= 0) {
        const t = activePU[i].type
        activePU.splice(i, 1)
        if (t === 'multi')  state.multiShot  = false
        if (t === 'speed')  state.speedBoost = false
      }
    }
  }

  function updatePowerups() {
    for (const p of state.powerups) {
      p.y += p.vy; p.angle += 0.06
      if (p.y > 720 + 40) p.dead = true
    }
    if (!state.player) { state.powerups = state.powerups.filter(p => !p.dead); return }
    const pl = state.player
    for (const p of state.powerups) {
      if (p.dead) continue
      if (Math.abs(p.x - pl.x) < (p.w + pl.w) / 2 && Math.abs(p.y - pl.y) < (p.h + pl.h) / 2) {
        p.dead = true
        applyPU(p.type)
        burst(p.x, p.y, p.color, 10, 3)
        addFloat(p.x, p.y - 20, p.label, p.color)
      }
    }
    state.powerups = state.powerups.filter(p => !p.dead)
  }

  return { maybeDropPU, dropBossGift, applyPU, tickPU, updatePowerups }
}
