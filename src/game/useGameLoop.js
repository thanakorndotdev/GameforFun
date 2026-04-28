import { state, resetState } from './state.js'
import { VW, VH, FIRE_RATE_NORMAL, FIRE_RATE_MULTI } from './constants.js'
import {
  gstate, score, level, combo, shieldHP,
  levelBonus, bossHpPct, bossPhase2,
  waveKilled, waveTotal, shakeActive,
  chargeLevel, chargeCooling, activePU,
  resetStore,
} from './store.js'
import { getDiffParams } from './difficulty.js'
import { useParallax }   from './composables/useParallax.js'
import { useParticles }  from './composables/useParticles.js'
import { usePlayer }     from './composables/usePlayer.js'
import { useEnemies }    from './composables/useEnemies.js'
import { usePowerUps }   from './composables/usePowerUps.js'
import { useCollisions } from './composables/useCollisions.js'
import { useStats }      from './composables/useStats.js'
import { useDraw }       from './composables/useDraw.js'

export function useGameLoop() {
  // Instantiate composables
  const parallax   = useParallax()
  const particles  = useParticles()
  const player     = usePlayer()
  const enemies    = useEnemies()
  const powerups   = usePowerUps()
  const stats      = useStats()
  const { draw }   = useDraw()

  const collisions = useCollisions({
    onPlayerDeath() {
      stats.calcRunStats()
      stats.persistStats()
      setTimeout(() => { gstate.value = 'gameover' }, 800)
    },
    breakFormation: enemies.breakFormation,
  })

  // ── Wave management ───────────────────────────────────────────────────────
  function startWave() {
    state.dp = getDiffParams(level.value)
    state.bossActive = false
    state.bossRef    = null
    bossHpPct.value  = -1
    bossPhase2.value = false

    const isBoss = level.value % state.dp.bossEveryN === 0
    if (isBoss) {
      gstate.value = 'bosswarning'
      setTimeout(() => {
        if (gstate.value === 'bosswarning') {
          gstate.value = 'playing'
          enemies.spawnBoss()
          state.waveLeft = 1
          waveTotal.value = 1; waveKilled.value = 0
        }
      }, 2400)
    } else {
      state.waveLeft = state.dp.waveSize
      waveTotal.value = state.dp.waveSize; waveKilled.value = 0
      state.spawnInterval = state.dp.spawnInterval
      state.spawnTimer    = 0
    }
  }

  function spawnNext() {
    if (state.waveLeft <= 0 || state.bossActive) return
    const r    = Math.random()
    const { kamikazeChance: k, dartChance: d, ufoChance: u, formationChance: f } = state.dp
    if      (r < f)         { enemies.spawnFormation() }
    else if (r < f+k)       { enemies.spawnDart(true)  }
    else if (r < f+k+d)     { enemies.spawnDart(false) }
    else if (r < f+k+d+u)   { enemies.spawnUFO()       }
    else                     { enemies.spawnAsteroid()  }
    state.waveLeft--
  }

  // ── Main update ───────────────────────────────────────────────────────────
  function update(dt) {
    state.shake = Math.max(0, state.shake - 1)
    if (state.screenFlash.alpha > 0) state.screenFlash.alpha = Math.max(0, state.screenFlash.alpha - 0.035)

    parallax.update(dt)
    player.tickPlayer(dt)
    player.tickCharge(dt)

    // Combo decay
    if (state.comboTimer > 0) {
      state.comboTimer -= dt
      if (state.comboTimer <= 0) combo.value = 1
    }

    // Screen shake CSS signal
    shakeActive.value = state.shake > 8

    // Auto-fire
    const fireRate = state.multiShot ? FIRE_RATE_MULTI : FIRE_RATE_NORMAL
    state.shootTimer -= dt
    if (state.shootTimer <= 0 && state.player && !state.charge.active && state.charge.cooldown <= 0) {
      state.shootTimer = fireRate
      const cx = state.player.x, ty = state.player.y - state.player.h / 2 - 8
      if (state.multiShot) {
        player.fireBullet(cx-13, ty, -0.6, -14, 'player', '#00ffff')
        player.fireBullet(cx,    ty,  0,   -15, 'player', '#ffffff')
        player.fireBullet(cx+13, ty,  0.6, -14, 'player', '#00ffff')
      } else {
        player.fireBullet(cx, ty, 0, -15, 'player', '#00ccff')
      }
    }

    // Spawn enemies
    if (!state.bossActive && state.waveLeft > 0) {
      state.spawnTimer -= dt
      if (state.spawnTimer <= 0) { state.spawnTimer = state.spawnInterval; spawnNext() }
    }

    // Move bullets + charged bullet trails
    for (const b of state.bullets) {
      b.x += b.vx; b.y += b.vy
      if (b.charged) {
        state.particles.push({
          x: b.x+(Math.random()-.5)*b.r*1.2, y: b.y+b.r*.8,
          vx: (Math.random()-.5)*1.2, vy: 1.5+Math.random()*2,
          color: b.color, size: 1.5+Math.random()*(b.r*.25),
          life: 12+Math.random()*12, maxLife: 24, dead: false,
        })
      }
      if (b.y < -60 || b.y > VH+30 || b.x < -30 || b.x > VW+30) b.dead = true
    }
    state.bullets = state.bullets.filter(b => !b.dead)

    enemies.update(dt)
    powerups.updatePowerups()
    powerups.tickPU(dt)
    particles.updateParticles()
    collisions.resolvePlayerBullets()
    collisions.resolveEnemyHits()
    state.enemies = state.enemies.filter(e => !e.dead)

    // Wave clear check
    if (gstate.value === 'playing' && state.enemies.length === 0 && state.waveLeft === 0 && !state.bossActive) {
      const bonus = level.value * 150
      levelBonus.value = bonus; score.value += bonus
      level.value++
      gstate.value = 'levelup'
    }
  }

  // ── Game loop ─────────────────────────────────────────────────────────────
  function loop(ts) {
    state.raf = requestAnimationFrame(loop)
    const dt = Math.min(ts - state.lastTime, 50)
    state.lastTime = ts
    if (gstate.value === 'playing') update(dt)
    draw(gstate.value)
  }

  // ── Game control ──────────────────────────────────────────────────────────
  function startGame() {
    resetState()
    resetStore()
    activePU.length = 0
    player.resetPlayer()
    parallax.init()
    startWave()
    if (!state.raf) state.raf = requestAnimationFrame(loop)
  }

  function advanceLevel() {
    state.bullets = []; state.enemies = []; state.particles = []; state.powerups = []; state.floats = []
    activePU.length = 0
    player.resetPlayer()
    state.bossActive = false; state.bossRef = null
    state.charge = { active: false, t: 0, cooldown: 0 }
    chargeLevel.value = 0; chargeCooling.value = false
    state.shootTimer = 0
    combo.value = 1
    gstate.value = 'playing'
    startWave()
  }

  function togglePause() {
    if (gstate.value === 'playing') gstate.value = 'paused'
    else if (gstate.value === 'paused') gstate.value = 'playing'
  }

  function initCanvas(canvas) {
    canvas.width = VW; canvas.height = VH
    state.ctx = canvas.getContext('2d')
    parallax.init()
    state.raf = requestAnimationFrame(loop)
  }

  function destroyLoop() { cancelAnimationFrame(state.raf); state.raf = null }

  // ── Input passthrough ─────────────────────────────────────────────────────
  function getCanvasPos(canvas, cx, cy) {
    const r = canvas.getBoundingClientRect()
    return { x: (cx - r.left) / r.width * VW, y: (cy - r.top) / r.height * VH }
  }

  function onMouseMove(canvas, e) {
    const pos = getCanvasPos(canvas, e.clientX, e.clientY)
    state.mouse.x = pos.x; state.mouse.y = pos.y; state.mouse.visible = true
    if (state.player && gstate.value === 'playing') state.player.tx = pos.x
  }

  function onMouseDown()  { if (gstate.value !== 'playing' || !state.player || state.charge.cooldown > 0) return; state.charge.active = true }
  function onMouseUp()    { if (state.charge.active) player.chargeShot() }
  function onMouseLeave() { state.mouse.visible = false }
  function onMouseEnter() { state.mouse.visible = true  }

  function onTouchMove(canvas, e) {
    if (!state.player || gstate.value !== 'playing') return
    state.player.tx = getCanvasPos(canvas, e.touches[0].clientX, e.touches[0].clientY).x
  }
  function onTouchStart(canvas, e) {
    if (!state.player || gstate.value !== 'playing') return
    state.player.tx = getCanvasPos(canvas, e.touches[0].clientX, e.touches[0].clientY).x
    if (state.charge.cooldown <= 0) state.charge.active = true
  }
  function onTouchEnd() { if (state.charge.active) player.chargeShot() }

  function resizeCanvas(canvas) {
    const scale = Math.min(window.innerWidth / VW, window.innerHeight / VH)
    canvas.style.width  = Math.round(VW * scale) + 'px'
    canvas.style.height = Math.round(VH * scale) + 'px'
    canvas.style.left   = Math.round((window.innerWidth  - VW * scale) / 2) + 'px'
    canvas.style.top    = Math.round((window.innerHeight - VH * scale) / 2) + 'px'
  }

  return {
    startGame, advanceLevel, togglePause,
    initCanvas, destroyLoop, resizeCanvas,
    onMouseMove, onMouseDown, onMouseUp, onMouseLeave, onMouseEnter,
    onTouchMove, onTouchStart, onTouchEnd,
  }
}
