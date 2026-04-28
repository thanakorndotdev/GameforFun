import { state } from '../state.js'
import { VW, CHARGE_MAX, CHARGE_CD, FIRE_RATE_NORMAL, FIRE_RATE_MULTI } from '../constants.js'
import { chargeLevel, chargeCooling, shieldHP, activePU, combo } from '../store.js'
import { useParticles } from './useParticles.js'

export function usePlayer() {
  const { burst, addFloat } = useParticles()

  function resetPlayer() {
    state.player = { x: VW / 2, y: 720 - 90, w: 38, h: 48, tx: VW / 2, inv: 0 }
    shieldHP.value   = 0
    state.multiShot  = false
    state.speedBoost = false
    state.charge     = { active: false, t: 0, cooldown: 0 }
    chargeLevel.value   = 0
    chargeCooling.value = false
  }

  function fireBullet(x, y, vx, vy, owner, color, w = 4, h = 16) {
    if (owner === 'player') state.runBulletsFired++
    state.bullets.push({ x, y, vx, vy, owner, color, w, h, dead: false })
  }

  function autoFire() {
    if (!state.player || state.charge.active || state.charge.cooldown > 0) return
    const fireRate = state.multiShot ? FIRE_RATE_MULTI : FIRE_RATE_NORMAL
    state.shootTimer -= 16 // will be subtracted by dt in useGameLoop
    const cx = state.player.x
    const ty = state.player.y - state.player.h / 2 - 8
    if (state.multiShot) {
      fireBullet(cx - 13, ty, -0.6, -14, 'player', '#00ffff')
      fireBullet(cx,      ty,  0,   -15, 'player', '#ffffff')
      fireBullet(cx + 13, ty,  0.6, -14, 'player', '#00ffff')
    } else {
      fireBullet(cx, ty, 0, -15, 'player', '#00ccff')
    }
  }

  function tickCharge(dt) {
    if (state.charge.active && state.player) {
      state.charge.t = Math.min(state.charge.t + dt, CHARGE_MAX)
      chargeLevel.value = state.charge.t / CHARGE_MAX
    }
    if (state.charge.cooldown > 0) {
      state.charge.cooldown -= dt
      chargeLevel.value = state.charge.cooldown / CHARGE_CD
      if (state.charge.cooldown <= 0) {
        state.charge.cooldown = 0
        chargeLevel.value = 0
        chargeCooling.value = false
      }
    }
  }

  function tickPlayer(dt) {
    if (!state.player) return
    state.player.x += (state.player.tx - state.player.x) * 0.14
    state.player.x = Math.max(state.player.w / 2, Math.min(VW - state.player.w / 2, state.player.x))
    if (state.player.inv > 0) state.player.inv -= dt
  }

  function chargeShot() {
    if (!state.player) { resetCharge(); return }
    const ratio = state.charge.t / CHARGE_MAX
    if (ratio < 0.15) { resetCharge(); return }
    state.runChargeUsed++

    const r     = 6 + ratio * 22
    const dmg   = Math.max(2, Math.round(ratio * 12))
    const pierce = ratio >= 0.99 ? 999 : ratio >= 0.7 ? 6 : ratio >= 0.3 ? 2 : 1
    const spd   = 14 + ratio * 6
    const color = ratio >= 0.99 ? '#ffffa0' : ratio >= 0.7 ? '#ffcc00' : '#cc88ff'
    const glow  = ratio >= 0.99 ? '#ffff44' : ratio >= 0.7 ? '#ff9900' : '#9933ff'

    state.bullets.push({
      x: state.player.x, y: state.player.y - state.player.h / 2 - r - 4,
      vx: 0, vy: -spd, owner: 'player', color, glow,
      w: r * 2, h: r * 2, r, dmg, pierceLeft: pierce,
      charged: true, hitSet: new Set(), dead: false,
    })

    burst(state.player.x, state.player.y - state.player.h / 2, color, 18 + Math.round(ratio * 14), 5 + ratio * 3, true)

    if (ratio >= 0.99) addFloat(state.player.x, state.player.y - 60, 'MAX POWER!!', '#ffff44')
    else if (ratio >= 0.7) addFloat(state.player.x, state.player.y - 50, 'CHARGED!', '#ffcc00')

    state.charge.t = 0
    state.charge.active = false
    state.charge.cooldown = CHARGE_CD
    chargeLevel.value = 0
    chargeCooling.value = true
    state.shootTimer = 350
  }

  function resetCharge() {
    state.charge.active = false; state.charge.t = 0
    chargeLevel.value = 0; chargeCooling.value = false
  }

  function startCharge() {
    if (state.charge.cooldown > 0) return
    state.charge.active = true
  }

  function draw(c) {
    if (!state.player) return
    const vis = state.player.inv <= 0 || Math.floor(state.player.inv / 80) % 2 === 0
    if (!vis) return

    c.save(); c.translate(state.player.x, state.player.y)
    const w = state.player.w, h = state.player.h

    // Engine glow + flame
    c.shadowColor = '#0066ff'; c.shadowBlur = 18
    c.fillStyle = '#0044ff44'
    c.beginPath(); c.ellipse(0, h / 2 + 6, 10, 4, 0, 0, Math.PI * 2); c.fill()
    const fl = 12 + Math.random() * 9
    c.fillStyle = '#0055ff'
    c.beginPath(); c.moveTo(-8, h/2-2); c.lineTo(8, h/2-2); c.lineTo(0, h/2+fl); c.closePath(); c.fill()
    c.fillStyle = '#44aaff'
    c.beginPath(); c.moveTo(-4, h/2-2); c.lineTo(4, h/2-2); c.lineTo(0, h/2+fl*0.55); c.closePath(); c.fill()

    // Hull
    c.shadowColor = '#00aaff'; c.shadowBlur = 10
    c.fillStyle = '#002a55'; c.strokeStyle = '#00aaff'; c.lineWidth = 1.5
    c.beginPath()
    c.moveTo(0, -h/2); c.lineTo(w/2, h*0.2); c.lineTo(w*0.35, h/2)
    c.lineTo(-w*0.35, h/2); c.lineTo(-w/2, h*0.2); c.closePath()
    c.fill(); c.stroke()

    // Wings
    c.fillStyle = '#003866'; c.strokeStyle = '#0077cc'; c.lineWidth = 1
    for (const sign of [-1, 1]) {
      c.beginPath()
      c.moveTo(sign*w*0.35, h*0.1); c.lineTo(sign*w*0.5, h*0.2)
      c.lineTo(sign*w*0.45, h*0.45); c.lineTo(sign*w*0.2, h/2)
      c.closePath(); c.fill(); c.stroke()
    }

    // Cockpit
    c.shadowColor = '#aaffff'; c.shadowBlur = 8
    c.fillStyle = '#aaffff33'; c.strokeStyle = '#00eeff'; c.lineWidth = 1
    c.beginPath(); c.ellipse(0, -h*0.1, w*0.18, h*0.22, 0, 0, Math.PI*2); c.fill(); c.stroke()

    // Shield ring
    if (shieldHP.value > 0) {
      c.shadowColor = '#0088ff'; c.shadowBlur = 24
      c.strokeStyle = `rgba(0,160,255,${0.5 + 0.4 * Math.sin(Date.now() * 0.006)})`
      c.lineWidth = 3
      c.beginPath(); c.arc(0, 0, Math.max(w, h) * 0.75, 0, Math.PI*2); c.stroke()
    }

    // Charge energy rings
    if (state.charge.active && state.charge.t > 0) {
      const ratio  = state.charge.t / CHARGE_MAX
      const cColor = ratio >= 0.99 ? '#ffffa0' : ratio >= 0.7 ? '#ffcc00' : '#cc88ff'
      const numOrbs = 2 + Math.floor(ratio * 5)
      c.shadowColor = cColor; c.shadowBlur = 18
      for (let i = 0; i < numOrbs; i++) {
        const a = (i / numOrbs) * Math.PI * 2 + Date.now() * 0.005
        const orR = 28 + ratio * 14
        c.globalAlpha = 0.6 + 0.4 * Math.sin(Date.now() * 0.008 + i)
        c.fillStyle = cColor
        c.beginPath(); c.arc(Math.cos(a) * orR, Math.sin(a) * orR, 2 + ratio * 2.5, 0, Math.PI * 2); c.fill()
      }
      c.globalAlpha = 1
      c.strokeStyle = cColor; c.lineWidth = 2 + ratio * 2.5; c.shadowBlur = 12
      c.beginPath(); c.arc(0, 0, 30 + ratio * 14, -Math.PI / 2, -Math.PI / 2 + ratio * Math.PI * 2); c.stroke()
    }

    c.restore()
  }

  return { resetPlayer, fireBullet, tickPlayer, tickCharge, chargeShot, resetCharge, startCharge, draw }
}
