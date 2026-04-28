import { state } from '../state.js'
import { score, combo, lives, shieldHP, activePU, waveKilled, waveTotal, bossHpPct, bossPhase2 } from '../store.js'
import { useParticles } from './useParticles.js'
import { usePowerUps }  from './usePowerUps.js'

// ── Geometry helpers ────────────────────────────────────────────────────────
export function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return Math.abs(ax - bx) < (aw + bw) / 2 && Math.abs(ay - by) < (ah + bh) / 2
}
export function circleRect(cx, cy, cr, rx, ry, rw, rh) {
  const dx = Math.abs(cx - rx), dy = Math.abs(cy - ry)
  if (dx > rw / 2 + cr || dy > rh / 2 + cr) return false
  if (dx <= rw / 2 || dy <= rh / 2) return true
  return (dx - rw / 2) ** 2 + (dy - rh / 2) ** 2 <= cr * cr
}

export function useCollisions({ onPlayerDeath, breakFormation }) {
  const { burst, addFloat, sparkAt } = useParticles()
  const { maybeDropPU, dropBossGift } = usePowerUps()

  // ── Player bullets → enemies ──────────────────────────────────────────────
  function resolvePlayerBullets() {
    for (const b of state.bullets) {
      if (b.dead || b.owner !== 'player') continue
      for (const e of state.enemies) {
        if (e.dead) continue
        if (b.hitSet && b.hitSet.has(e)) continue

        const hitR = b.charged ? b.r : 3
        const hit  = e.type === 'asteroid'
          ? circleRect(b.x, b.y, hitR, e.x, e.y, e.r * 2, e.r * 2)
          : rectOverlap(b.x, b.y, b.w, b.h, e.x, e.y, e.w, e.h)
        if (!hit) continue

        sparkAt(b.x, b.y, b.charged ? b.color : '#aaffff', b.charged ? 6 : 1)
        e.hp -= (b.dmg || 1)

        if (b.charged) {
          b.hitSet.add(e); b.pierceLeft--
          if (b.pierceLeft <= 0) b.dead = true
        } else {
          b.dead = true
        }

        if (e.hp <= 0) killEnemy(e, b.charged)
        if (!b.charged) break
      }
    }
  }

  function killEnemy(e, charged = false) {
    e.dead = true
    const pts = Math.round(e.pts * combo.value * state.dp.pointMult * (charged ? 1.5 : 1))
    score.value += pts
    combo.value = Math.min(10, combo.value + 1)
    state.comboTimer = 3500
    if (combo.value > state.runMaxCombo) state.runMaxCombo = combo.value
    state.sessionKills++
    waveKilled.value = Math.min(waveKilled.value + 1, waveTotal.value)
    addFloat(e.x, e.y, `+${pts}`, combo.value > 3 ? '#ff9900' : '#ffff88')

    const ec = { boss:'#ff4400', ufo:'#44ff88', dart:'#ff4444', asteroid:'#ffaa44', formation: e.tint || '#ff8844' }[e.type] || '#ffaa44'
    burst(e.x, e.y, ec, e.type === 'boss' ? 35 : 14, 4, e.type === 'boss')
    burst(e.x, e.y, '#ffffff', 6, 2)

    if (e.type === 'boss') {
      state.sessionBossKills++
      state.bossActive = false; state.bossRef = null
      bossHpPct.value = -1; bossPhase2.value = false
      dropBossGift(e.x, e.y)
    } else if (e.type === 'formation') {
      breakFormation(e)
      maybeDropPU(e.x, e.y)
    } else {
      maybeDropPU(e.x, e.y)
    }
  }

  // ── Enemy bullets + bodies → player ───────────────────────────────────────
  function resolveEnemyHits() {
    if (!state.player || state.player.inv > 0) return
    for (const b of state.bullets) {
      if (b.dead || b.owner !== 'enemy') continue
      if (rectOverlap(b.x, b.y, b.w, b.h, state.player.x, state.player.y, state.player.w * 0.85, state.player.h * 0.85)) {
        b.dead = true; hitPlayer(); return
      }
    }
    for (const e of state.enemies) {
      if (e.dead) continue
      const hit = e.type === 'asteroid'
        ? circleRect(state.player.x, state.player.y, state.player.w / 2 * 0.8, e.x, e.y, e.r * 2, e.r * 2)
        : rectOverlap(state.player.x, state.player.y, state.player.w * 0.8, state.player.h * 0.8, e.x, e.y, e.w * 0.8, e.h * 0.8)
      if (hit) { hitPlayer(); e.hp -= 2; if (e.hp <= 0) killEnemy(e); return }
    }
  }

  function hitPlayer() {
    if (!state.player || state.player.inv > 0) return
    if (shieldHP.value > 0) {
      shieldHP.value--
      state.runShieldBlocks++
      burst(state.player.x, state.player.y, '#00aaff', 12)
      addFloat(state.player.x, state.player.y - 30, 'SHIELD BLOCK!', '#00aaff')
      state.player.inv = 500
      state.shake = 5
      if (shieldHP.value === 0) {
        const i = activePU.findIndex(p => p.type === 'shield')
        if (i !== -1) activePU.splice(i, 1)
      }
      return
    }
    state.runTimesHit++
    lives.value--; combo.value = 1
    burst(state.player.x, state.player.y, '#ff4488', 20)
    state.shake = 14
    if (lives.value <= 0) {
      burst(state.player.x, state.player.y, '#ffaa44', 28)
      state.player = null
      onPlayerDeath()
    } else {
      state.player.inv = 2200
      addFloat(state.player.x, state.player.y - 40, `${lives.value} LIVES LEFT`, '#ff4488')
    }
  }

  return { resolvePlayerBullets, resolveEnemyHits }
}
