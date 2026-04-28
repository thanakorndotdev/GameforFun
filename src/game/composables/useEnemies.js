import { state } from '../state.js'
import { VW, VH } from '../constants.js'
import { level, bossHpPct, bossPhase2, waveKilled, waveTotal } from '../store.js'
import { useParticles } from './useParticles.js'

const FORMATION_SHAPES = {
  V:       [[0,0],[-1,1],[1,1],[-2,2],[2,2]],
  arrow:   [[0,0],[-1,1],[1,1],[-2,2],[2,2],[0,2]],
  grid:    [[-1,0],[0,0],[1,0],[-1,1],[0,1],[1,1]],
  diamond: [[0,0],[-1,1],[1,1],[0,2]],
  pincer:  [[-2,0],[-1,0],[1,0],[2,0],[0,1]],
}
const FORMATION_TINTS = { V:'#ff8844', arrow:'#ff4488', grid:'#44ffaa', diamond:'#44aaff', pincer:'#ffcc00' }

export function useEnemies() {
  const { burst, addFloat } = useParticles()

  // ── Factories ────────────────────────────────────────────────────────────
  function spawnAsteroid() {
    const big   = Math.random() < state.dp.asteroidBig
    const r     = big ? 32 + Math.random() * 10 : 14 + Math.random() * 10
    const sides = 7 + Math.floor(Math.random() * 5)
    const verts = []
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2
      verts.push({ x: Math.cos(a) * r * (0.65 + Math.random() * 0.35), y: Math.sin(a) * r * (0.65 + Math.random() * 0.35) })
    }
    state.enemies.push({
      type: 'asteroid', x: r + Math.random() * (VW - r * 2), y: -r - 10,
      vx: (Math.random() - 0.5) * 2.5, vy: state.dp.enemySpeed * (big ? 0.7 : 1),
      r, verts, angle: Math.random() * Math.PI * 2, rotSpd: (Math.random() - 0.5) * 0.05,
      hp: big ? 3 : 1, maxHp: big ? 3 : 1, pts: big ? 30 : 10, dead: false,
    })
  }

  function spawnUFO() {
    const left = Math.random() < 0.5
    const hp   = 2 + Math.floor(level.value / 2)
    state.enemies.push({
      type: 'ufo',
      x: left ? -45 : VW + 45, y: 80 + Math.random() * 240,
      vx: (left ? 1 : -1) * state.dp.enemySpeed * 0.85, vy: 0.4,
      sineT: 0, sineAmp: 22 + Math.random() * 20,
      w: 54, h: 28, hp, maxHp: hp, pts: 50, shootTimer: 60 + Math.random() * 60, dead: false,
    })
  }

  function spawnDart(kamikaze = false) {
    const pl = state.player
    const tx = pl ? pl.x : VW / 2
    const ty = pl ? pl.y : VH / 2
    const sx = 30 + Math.random() * (VW - 60), sy = -30
    const spd = state.dp.enemySpeed * (kamikaze ? 1.8 : 1.2)
    const dx = tx - sx, dy = ty - sy
    const d  = Math.sqrt(dx * dx + dy * dy)
    state.enemies.push({
      type: 'dart', x: sx, y: sy,
      vx: kamikaze ? dx / d * spd : (Math.random() - 0.5) * 3,
      vy: kamikaze ? dy / d * spd : spd,
      w: 18, h: 32, hp: 1, maxHp: 1, pts: kamikaze ? 40 : 25,
      kamikaze, angle: kamikaze ? Math.atan2(dy, dx) - Math.PI / 2 : 0, dead: false,
    })
  }

  function spawnFormation() {
    const lv = level.value
    const names = Object.keys(FORMATION_SHAPES)
    const pool  = lv >= 6 ? [...names, 'arrow', 'pincer'] : lv >= 4 ? [...names, 'V', 'grid'] : ['V', 'grid', 'diamond']
    const shape = pool[Math.floor(Math.random() * pool.length)]
    const slots = FORMATION_SHAPES[shape]
    const fid   = ++state.formationIdCtr
    const tint  = FORMATION_TINTS[shape] || '#ff8844'
    const pts   = 20 + slots.length * 8
    const gap   = 38
    const startX = gap * 1.5 + Math.random() * (VW - gap * 3)

    let leaderRef = null
    slots.forEach(([col, row], idx) => {
      const isLeader = idx === 0
      const m = {
        type: 'formation', x: startX + col * gap, y: -50 - row * gap,
        vx: 0, vy: state.dp.enemySpeed * 0.75,
        w: 18, h: 28, hp: 1, maxHp: 1, pts, fid, shape, tint,
        col, row, slotGap: gap, isLeader, leader: null,
        diving: false, angle: 0, t: 0, dead: false,
      }
      if (isLeader) { state.enemies.push(m); leaderRef = m }
      else { m.leader = leaderRef; state.enemies.push(m) }
    })
    waveLeft -= (slots.length - 1)
  }

  function spawnBoss() {
    const hp = state.dp.bossHp
    const b  = {
      type: 'boss', x: VW / 2, y: -120, targetY: 105,
      vx: 1.1 + level.value * 0.03, vy: 1.2,
      w: 140, h: 100, hp, maxHp: hp,
      pts: 800 + level.value * 100,
      t: 0, phase: 0, shootTimer: 50, dead: false,
      p2: false, p2rage: false, p2teleTimer: 0, p2ringTimer: 0, p2riftTimer: 0,
      p2orbitAngle: 0, p2flashAlpha: 0,
    }
    state.enemies.push(b)
    state.bossRef = b
    state.bossActive = true
    bossPhase2.value = false
    bossHpPct.value  = 100
  }

  let waveLeft = 0  // local mirror — kept in sync with state.waveLeft

  function breakFormation(dead) {
    if (!state.player) return
    state.enemies.forEach(e => {
      if (e.type !== 'formation' || e.fid !== dead.fid || e.dead) return
      e.diving = true; e.leader = null
      const dx = state.player.x - e.x + (Math.random() - 0.5) * 60
      const dy = state.player.y - e.y
      const d  = Math.sqrt(dx * dx + dy * dy) + 0.001
      const spd = state.dp.enemySpeed * 1.5
      e.vx = dx / d * spd; e.vy = dy / d * spd
      e.angle = Math.atan2(e.vy, e.vx) - Math.PI / 2
    })
  }

  // ── Boss phase 2 helpers ─────────────────────────────────────────────────
  function fireRing(x, y, n, speed, color) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      state.bullets.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, owner: 'enemy', color, w: 5, h: 14, dead: false })
    }
  }

  function fireRift(bossX, bossY) {
    if (!state.player) return
    for (const side of [-1, 1]) {
      const sx = side === -1 ? 0 : VW
      const sy = 80 + Math.random() * (VH - 200)
      const dx = state.player.x - sx, dy = state.player.y - sy
      const d  = Math.sqrt(dx * dx + dy * dy) + 0.001
      const spd = state.dp.enemyBulletSpd * 1.1
      state.bullets.push({ x: sx, y: sy, vx: dx / d * spd, vy: dy / d * spd, owner: 'enemy', color: '#cc44ff', w: 6, h: 14, dead: false })
      burst(sx, sy, '#cc44ff', 6, 3)
    }
  }

  function triggerPhase2(e) {
    e.p2 = true; bossPhase2.value = true
    e.vx = (e.vx > 0 ? 1 : -1) * (Math.abs(e.vx) * 1.3)
    state.screenFlash.color = '#8800cc'; state.screenFlash.alpha = 0.55
    triggerShake(20)
    state.bullets = state.bullets.filter(b => b.owner !== 'enemy')
    addFloat(e.x, e.y - 70, '⚠ PHASE 2 ⚠', '#dd44ff')
    burst(e.x, e.y, '#cc44ff', 40, 6, true)
    burst(e.x, e.y, '#ffffff', 16, 3)
    e.p2ringTimer = 800; e.p2riftTimer = 2500; e.p2teleTimer = 5000; e.shootTimer = 1000
  }

  function triggerShake(amt) { state.shake = amt }

  // ── Update all enemies ────────────────────────────────────────────────────
  function update(dt) {
    for (const e of state.enemies) {
      if (e.type === 'asteroid') {
        e.x += e.vx; e.y += e.vy; e.angle += e.rotSpd
        if (e.y > VH + 70) e.dead = true

      } else if (e.type === 'ufo') {
        e.sineT += 0.04
        e.x += e.vx + Math.sin(e.sineT) * e.sineAmp * 0.04; e.y += e.vy
        if (e.x < -90 || e.x > VW + 90 || e.y > VH + 50) e.dead = true
        if (state.player && level.value >= 3) {
          e.shootTimer -= dt
          if (e.shootTimer <= 0) {
            e.shootTimer = state.dp.ufoShootRate
            const dx = state.player.x - e.x, dy = state.player.y - e.y
            const d  = Math.sqrt(dx * dx + dy * dy)
            state.bullets.push({ x: e.x, y: e.y + e.h / 2, vx: dx / d * state.dp.enemyBulletSpd, vy: dy / d * state.dp.enemyBulletSpd, owner: 'enemy', color: '#ff4444', w: 5, h: 12, dead: false })
          }
        }

      } else if (e.type === 'dart') {
        if (e.kamikaze && state.player) {
          const dx = state.player.x - e.x, dy = state.player.y - e.y
          const d  = Math.sqrt(dx * dx + dy * dy) + 0.001
          e.vx += dx / d * 0.2; e.vy += dy / d * 0.2
          const spd = Math.sqrt(e.vx * e.vx + e.vy * e.vy)
          if (spd > state.dp.enemySpeed * 2.2) { e.vx *= state.dp.enemySpeed * 2.2 / spd; e.vy *= state.dp.enemySpeed * 2.2 / spd }
          e.angle = Math.atan2(e.vy, e.vx) - Math.PI / 2
        }
        e.x += e.vx; e.y += e.vy
        if (e.y > VH + 50 || e.x < -50 || e.x > VW + 50) e.dead = true

      } else if (e.type === 'formation') {
        e.t += dt
        if (e.diving) {
          if (state.player) {
            const dx = state.player.x - e.x, dy = state.player.y - e.y
            const d  = Math.sqrt(dx * dx + dy * dy) + 0.001
            e.vx += dx / d * 0.25; e.vy += dy / d * 0.25
            const spd = Math.sqrt(e.vx * e.vx + e.vy * e.vy)
            const max = state.dp.enemySpeed * 2.4
            if (spd > max) { e.vx *= max / spd; e.vy *= max / spd }
            e.angle = Math.atan2(e.vy, e.vx) - Math.PI / 2
          }
          e.x += e.vx; e.y += e.vy
          if (e.y > VH + 60 || e.x < -60 || e.x > VW + 60) e.dead = true
        } else if (e.leader && !e.leader.dead) {
          const tx = e.leader.x + e.col * e.slotGap
          const ty = e.leader.y + e.row * e.slotGap
          e.x += (tx + Math.sin(e.t * 0.003 + e.col) * 2 - e.x) * 0.18
          e.y += (ty - e.y) * 0.18
        } else if (!e.isLeader && !e.diving) {
          e.diving = true
          if (state.player) {
            const dx = state.player.x - e.x + (Math.random() - 0.5) * 50
            const dy = state.player.y - e.y
            const d  = Math.sqrt(dx * dx + dy * dy) + 0.001
            const spd = state.dp.enemySpeed * 1.5
            e.vx = dx / d * spd; e.vy = dy / d * spd
            e.angle = Math.atan2(e.vy, e.vx) - Math.PI / 2
          }
        } else if (e.isLeader) {
          e.x += Math.sin(e.t * 0.0015) * 1.2
          e.y += state.dp.enemySpeed * 0.75
          e.x = Math.max(e.w / 2, Math.min(VW - e.w / 2, e.x))
          if (e.y > VH + 60) e.dead = true
        }

      } else if (e.type === 'boss') {
        e.t += dt
        if (e.phase === 0) {
          e.y += Math.min(e.vy, Math.max(0.3, (e.targetY - e.y) * 0.06))
          if (e.y >= e.targetY) e.phase = 1
        } else {
          if (!e.p2 && e.hp <= e.maxHp * 0.5) triggerPhase2(e)
          if (e.p2 && !e.p2rage && e.hp <= e.maxHp * 0.25) {
            e.p2rage = true; e.vx *= 1.2
            state.screenFlash.color = '#ff0044'; state.screenFlash.alpha = 0.4
            addFloat(e.x, e.y - 80, '★ RAGE ★', '#ff4488'); triggerShake(14)
          }
          if (e.p2) e.p2orbitAngle += dt * (e.p2rage ? 0.006 : 0.004)
          e.x += e.vx
          if (e.x > VW - e.w / 2 - 8) e.vx = -Math.abs(e.vx)
          if (e.x < e.w / 2 + 8)      e.vx =  Math.abs(e.vx)

          if (!e.p2) {
            e.shootTimer -= dt
            if (e.shootTimer <= 0) {
              e.shootTimer = Math.max(900, 3000 - level.value * 80)
              for (let i = (level.value >= 7 ? -2 : -1); i <= (level.value >= 7 ? 2 : 1); i++)
                state.bullets.push({ x: e.x + i * 28, y: e.y + e.h / 2, vx: i * 0.9 + (state.player ? (state.player.x - e.x) / VH * 1.5 : 0), vy: state.dp.enemyBulletSpd, owner: 'enemy', color: '#ff6600', w: 6, h: 14, dead: false })
            }
          }

          if (e.p2) {
            const spd  = state.dp.enemyBulletSpd * (e.p2rage ? 1.1 : 0.95)
            e.shootTimer -= dt
            if (e.shootTimer <= 0) {
              e.shootTimer = e.p2rage ? 800 : 1200
              if (state.player) {
                const dx = state.player.x - e.x, dy = state.player.y - e.y
                const d  = Math.sqrt(dx * dx + dy * dy) + 0.001
                for (const off of [-0.2, 0, 0.2]) {
                  const a = Math.atan2(dy, dx) + off
                  state.bullets.push({ x: e.x, y: e.y + e.h / 2, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, owner: 'enemy', color: '#ff44aa', w: 5, h: 12, dead: false })
                }
                if (e.p2rage) state.bullets.push({ x: e.x, y: e.y, vx: 0, vy: -spd * 0.7, owner: 'enemy', color: '#ff44aa', w: 5, h: 12, dead: false })
              }
            }
            e.p2ringTimer -= dt
            if (e.p2ringTimer <= 0) { e.p2ringTimer = e.p2rage ? 1800 : 2600; fireRing(e.x, e.y, e.p2rage ? 8 : 6, spd * 0.7, '#cc44ff') }
            e.p2riftTimer -= dt
            if (e.p2riftTimer <= 0) {
              e.p2riftTimer = e.p2rage ? 2400 : 3500
              const count  = e.p2rage ? 2 : 1
              for (let i = 0; i < count; i++) setTimeout(() => { if (e && !e.dead) fireRift(e.x, e.y) }, i * 400)
            }
            e.p2teleTimer -= dt
            if (e.p2teleTimer <= 0) {
              e.p2teleTimer = e.p2rage ? 3500 : 6000
              e.p2flashAlpha = 1.0
              state.screenFlash.color = '#aa00ff'; state.screenFlash.alpha = 0.25
              const newX = e.w / 2 + 30 + Math.random() * (VW - e.w - 60)
              setTimeout(() => { if (e && !e.dead) { e.x = newX; e.p2flashAlpha = 1.0; burst(e.x, e.y, '#cc44ff', 18, 4); triggerShake(6) } }, 180)
            }
            if (e.p2flashAlpha > 0) e.p2flashAlpha = Math.max(0, e.p2flashAlpha - dt * 0.004)
          }
        }
        bossHpPct.value = e.hp / e.maxHp * 100
      }
    }
    state.enemies = state.enemies.filter(e => !e.dead)
  }

  return { spawnAsteroid, spawnUFO, spawnDart, spawnFormation, spawnBoss, breakFormation, update }
}
