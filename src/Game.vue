<template>
  <div ref="rootEl" class="relative w-full h-full overflow-hidden select-none bg-black"
    :class="{ 'animate-shake': shakeActive }">

    <!-- CANVAS (game rendering) -->
    <canvas ref="canvasRef"
      class="absolute"
      style="image-rendering: pixelated;"
      @mousemove="onMouseMove"
      @touchmove.prevent="onTouchMove"
      @touchstart.prevent="onTouchMove"
    />

    <!-- ═══════════════ HUD ═══════════════ -->
    <div v-if="gstate === 'playing' || gstate === 'paused'"
      class="absolute top-0 left-0 right-0 z-10 flex items-start justify-between px-4 pt-2 pb-6
             bg-gradient-to-b from-black/80 to-transparent pointer-events-none">

      <!-- Score + Combo -->
      <div class="hud-panel">
        <div class="hud-label">SCORE</div>
        <div class="hud-value text-xl tabular-nums">{{ score.toLocaleString() }}</div>
        <Transition name="combo-pop">
          <div v-if="combo > 1" key="combo"
            class="font-orbitron text-xs mt-0.5"
            :class="combo >= 5 ? 'neon-text-pink animate-flicker' : combo >= 3 ? 'neon-text-orange' : 'text-yellow-400'">
            ×{{ combo }} COMBO!
          </div>
        </Transition>
      </div>

      <!-- Difficulty + Level center -->
      <div class="hud-panel">
        <div class="hud-label">LEVEL</div>
        <div class="hud-value">{{ level }}</div>
        <div class="difficulty-badge mt-1" :class="diffBadgeClass">
          {{ diffLabel }}
        </div>
      </div>

      <!-- Lives + Shield -->
      <div class="hud-panel items-end">
        <div class="hud-label">LIVES</div>
        <div class="flex gap-1 mt-0.5">
          <span v-for="i in MAX_LIVES" :key="i"
            class="text-lg transition-all duration-300"
            :class="i <= lives ? 'neon-text-pink' : 'text-gray-800'">♥</span>
        </div>
        <div v-if="shieldHP > 0" class="flex items-center gap-1 mt-1">
          <span class="text-blue-400 text-xs font-orbitron">SHIELD</span>
          <div class="flex gap-0.5">
            <span v-for="s in 3" :key="s" class="text-sm"
              :class="s <= shieldHP ? 'text-blue-400' : 'text-gray-800'">▮</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Difficulty ramp bar (shows during playing) -->
    <div v-if="gstate === 'playing'" class="absolute top-16 left-4 right-4 z-10 pointer-events-none">
      <!-- Wave progress bar -->
      <div class="flex items-center gap-2 mb-1">
        <span class="font-orbitron text-[9px] text-cyan-800 tracking-widest">WAVE</span>
        <div class="flex-1 h-1 bg-gray-900 rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all duration-500"
            :style="{ width: waveProgressPct + '%', background: diffGradient }" />
        </div>
        <span class="font-orbitron text-[9px] text-cyan-800 tracking-widest">{{ waveKilled }}/{{ waveTotal }}</span>
      </div>
    </div>

    <!-- Active Power-ups (bottom) -->
    <div v-if="gstate === 'playing' && activePU.length > 0"
      class="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 pointer-events-none">
      <TransitionGroup name="pu-list">
        <div v-for="p in activePU" :key="p.id" class="pu-chip">
          <span class="text-base leading-none">{{ p.icon }}</span>
          <div class="w-8 h-1 bg-gray-900 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-none"
              :style="{ width: (p.t / p.max * 100) + '%', background: p.color }" />
          </div>
          <span class="font-orbitron text-[8px]" :style="{ color: p.color }">{{ p.label }}</span>
        </div>
      </TransitionGroup>
    </div>

    <!-- BOSS Health Bar (top, full width) -->
    <Transition name="slide-in">
      <div v-if="gstate === 'playing' && bossHpPct >= 0"
        class="absolute top-[72px] left-4 right-4 z-10 pointer-events-none">
        <div class="flex items-center gap-2">
          <span class="font-orbitron text-[10px] text-orange-500 tracking-widest animate-flicker">BOSS</span>
          <div class="flex-1 h-3 bg-red-950 rounded border border-red-900 overflow-hidden">
            <div class="h-full transition-all duration-100 rounded"
              :style="{ width: bossHpPct + '%', background: 'linear-gradient(90deg, #ff2200, #ff6600)' }" />
          </div>
          <span class="font-orbitron text-[10px] text-orange-400">{{ Math.ceil(bossHpPct) }}%</span>
        </div>
      </div>
    </Transition>

    <!-- ═══════════════ PAUSE BUTTON ═══════════════ -->
    <button v-if="gstate === 'playing'"
      @click="togglePause"
      class="absolute top-2.5 right-3 z-20 w-9 h-9 rounded-lg
             border border-blue-900 bg-blue-950/70 text-cyan-500
             hover:bg-blue-900/80 hover:border-cyan-700 transition-all text-sm">
      ⏸
    </button>

    <!-- ═══════════════ START SCREEN ═══════════════ -->
    <Transition name="fade">
      <div v-if="gstate === 'start'"
        class="overlay-base bg-space-900/90">

        <div class="text-center space-y-1">
          <div class="font-orbitron text-xs tracking-[6px] text-cyan-800 animate-pulse-slow">WAVE SHOOTER</div>
          <h1 class="font-orbitron font-black text-5xl leading-tight">
            <span class="neon-text-blue block">SPACE</span>
            <span class="neon-text-orange block">SHOOTER</span>
          </h1>
          <p class="font-sarabun text-cyan-600 text-sm mt-1">กู้กาแล็กซี — ยากขึ้นเรื่อยๆ ทุกด่าน!</p>
        </div>

        <!-- Difficulty preview -->
        <div class="w-72 bg-gray-950 rounded-xl border border-gray-800 overflow-hidden">
          <div class="px-4 py-2 bg-gray-900 border-b border-gray-800">
            <span class="font-orbitron text-[10px] tracking-widest text-gray-500">DIFFICULTY CURVE</span>
          </div>
          <div class="p-3 space-y-2">
            <div v-for="tier in diffTiers" :key="tier.levels" class="flex items-center gap-3">
              <div class="difficulty-badge" :class="tier.badge">{{ tier.label }}</div>
              <span class="font-orbitron text-[10px] text-gray-500">ด่าน {{ tier.levels }}</span>
              <div class="flex-1 text-right font-sarabun text-xs text-gray-600">{{ tier.desc }}</div>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="w-72 bg-blue-950/40 border border-blue-900/50 rounded-xl p-3 space-y-1.5">
          <div class="font-orbitron text-[9px] tracking-widest text-blue-800 mb-2">วิธีเล่น</div>
          <div v-for="c in controls" :key="c.k"
            class="flex items-center gap-3 font-sarabun text-sm text-cyan-700">
            <span class="text-base">{{ c.icon }}</span>
            <span class="text-gray-500">{{ c.k }}</span>
            <span>{{ c.desc }}</span>
          </div>
        </div>

        <button @click="startGame"
          class="btn-neon border-neon-blue neon-text-blue bg-blue-950/60 hover:bg-blue-900/80 text-sm">
          🚀 เริ่มเกม!
        </button>

        <div v-if="highScore > 0"
          class="font-orbitron text-xs text-yellow-700 flex items-center gap-2">
          🏆 สถิติ: {{ highScore.toLocaleString() }}
        </div>
      </div>
    </Transition>

    <!-- ═══════════════ LEVEL UP ═══════════════ -->
    <Transition name="bounce-in">
      <div v-if="gstate === 'levelup'"
        class="overlay-base bg-black/80">
        <div class="text-center space-y-2">
          <div class="text-5xl animate-bounce">⭐</div>
          <h2 class="font-orbitron font-black text-4xl neon-text-yellow animate-slide-down">
            LEVEL CLEAR!
          </h2>
          <div class="font-orbitron text-sm text-yellow-700">ด่าน {{ level - 1 }} สำเร็จ</div>
        </div>

        <!-- Stats -->
        <div class="w-72 bg-yellow-950/40 border border-yellow-800/50 rounded-xl p-4 space-y-2">
          <div class="flex justify-between font-orbitron text-sm">
            <span class="text-gray-500">โบนัสด่าน</span>
            <span class="text-yellow-400">+{{ levelBonus.toLocaleString() }}</span>
          </div>
          <div class="flex justify-between font-orbitron text-sm">
            <span class="text-gray-500">รวมคะแนน</span>
            <span class="neon-text-yellow">{{ score.toLocaleString() }}</span>
          </div>
          <div class="border-t border-yellow-900/50 pt-2 flex justify-between font-orbitron text-xs text-gray-600">
            <span>ด่านถัดไป</span>
            <span :class="nextDiffBadgeTextClass">{{ nextDiffLabel }} →</span>
          </div>
        </div>

        <!-- Next level preview -->
        <div class="w-72 p-3 rounded-xl border bg-gray-950" :class="nextDiffBorderClass">
          <div class="font-orbitron text-[9px] tracking-widest mb-2" :class="nextDiffBadgeTextClass">ด่าน {{ level }} — อะไรใหม่?</div>
          <ul class="space-y-1">
            <li v-for="hint in nextLevelHints" :key="hint"
              class="font-sarabun text-xs text-gray-400 flex items-start gap-1.5">
              <span class="text-cyan-600 mt-0.5">▸</span> {{ hint }}
            </li>
          </ul>
        </div>

        <button @click="advanceLevel"
          class="btn-neon text-sm"
          :class="nextDiffBtnClass">
          ด่าน {{ level }} ➜
        </button>
      </div>
    </Transition>

    <!-- ═══════════════ BOSS WARNING ═══════════════ -->
    <Transition name="fade">
      <div v-if="gstate === 'bosswarning'"
        class="overlay-base animate-boss-warn">
        <div class="text-7xl animate-bounce">⚠️</div>
        <h2 class="font-orbitron font-black text-5xl neon-text-orange animate-flicker">
          BOSS
        </h2>
        <div class="font-orbitron text-2xl text-orange-700 animate-flicker" style="animation-delay:.2s">
          INCOMING!
        </div>
        <div class="font-orbitron text-xs tracking-widest text-orange-900">เตรียมรับมือ...</div>
      </div>
    </Transition>

    <!-- ═══════════════ GAME OVER ═══════════════ -->
    <Transition name="fade">
      <div v-if="gstate === 'gameover'"
        class="overlay-base bg-black/95">
        <h2 class="font-orbitron font-black text-5xl neon-text-pink">GAME OVER</h2>

        <div class="text-center">
          <div class="font-orbitron font-bold text-4xl neon-text-yellow tabular-nums">
            {{ score.toLocaleString() }}
          </div>
          <div class="font-sarabun text-gray-600 text-sm mt-1">ถึงด่านที่ {{ level }}</div>
        </div>

        <Transition name="bounce-in">
          <div v-if="newRecord"
            class="font-orbitron text-sm neon-text-yellow bg-yellow-950/50 border border-yellow-600/50
                   px-5 py-2 rounded-full animate-glow-pulse">
            🏆 สถิติใหม่!
          </div>
        </Transition>

        <!-- Score breakdown -->
        <div class="w-72 bg-gray-950 rounded-xl border border-gray-800 overflow-hidden">
          <div class="px-4 py-2 bg-gray-900 border-b border-gray-800 font-orbitron text-[10px] tracking-widest text-gray-500">
            สรุป
          </div>
          <div class="p-3 space-y-2">
            <div class="flex justify-between font-orbitron text-xs">
              <span class="text-gray-600">สถิติสูงสุด</span>
              <span class="text-yellow-600">{{ highScore.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between font-orbitron text-xs">
              <span class="text-gray-600">ด่านสูงสุด</span>
              <span class="text-cyan-600">{{ bestLevel }}</span>
            </div>
            <div class="flex justify-between font-orbitron text-xs">
              <span class="text-gray-600">ฆ่าศัตรูรวม</span>
              <span class="text-orange-500">{{ totalKills }}</span>
            </div>
            <div class="flex justify-between font-orbitron text-xs">
              <span class="text-gray-600">Boss ที่กำจัด</span>
              <span class="text-red-500">{{ bossKills }}</span>
            </div>
          </div>
        </div>

        <button @click="startGame"
          class="btn-neon border-neon-blue neon-text-blue bg-blue-950/60 hover:bg-blue-900/80 text-sm">
          🔄 เล่นใหม่
        </button>
      </div>
    </Transition>

    <!-- ═══════════════ PAUSED ═══════════════ -->
    <Transition name="fade">
      <div v-if="gstate === 'paused'"
        class="overlay-base bg-black/70">
        <div class="text-4xl">⏸</div>
        <h2 class="font-orbitron font-bold text-2xl neon-text-blue">หยุดชั่วคราว</h2>
        <div class="w-64 p-3 bg-gray-950 rounded-xl border border-gray-800 space-y-1">
          <div class="flex justify-between font-orbitron text-xs text-gray-500">
            <span>คะแนน</span><span class="text-cyan-400">{{ score.toLocaleString() }}</span>
          </div>
          <div class="flex justify-between font-orbitron text-xs text-gray-500">
            <span>ด่าน</span><span class="text-cyan-400">{{ level }}</span>
          </div>
        </div>
        <button @click="togglePause"
          class="btn-neon border-neon-green neon-text-green bg-green-950/60 hover:bg-green-900/80 text-sm">
          ▶ เล่นต่อ
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'

// ─── Canvas virtual dimensions ─────────────────────────────────────────────
const VW = 480, VH = 720
const MAX_LIVES = 3

// ─── Difficulty tiers ──────────────────────────────────────────────────────
// Each tier defines how the game feels. Difficulty smoothly ramps within tiers.
const TIERS = [
  { minLevel: 1,  maxLevel: 2,  name: 'EASY',    color: '#00ff88', badge: 'bg-green-950 text-green-400 border border-green-800',  desc: 'เรียนรู้พื้นฐาน' },
  { minLevel: 3,  maxLevel: 4,  name: 'NORMAL',  color: '#00ccff', badge: 'bg-cyan-950 text-cyan-400 border border-cyan-800',     desc: 'เพิ่มศัตรู' },
  { minLevel: 5,  maxLevel: 6,  name: 'HARD',    color: '#ffcc00', badge: 'bg-yellow-950 text-yellow-400 border border-yellow-800', desc: 'UFO ยิงกลับ' },
  { minLevel: 7,  maxLevel: 9,  name: 'EXPERT',  color: '#ff6600', badge: 'bg-orange-950 text-orange-400 border border-orange-800', desc: 'Boss ทุกด่าน!' },
  { minLevel: 10, maxLevel: 99, name: 'INSANE',  color: '#ff4488', badge: 'bg-pink-950 text-pink-400 border border-pink-800',     desc: 'อยู่รอดให้ได้!' },
]

const diffTiers = [
  { levels: '1–2',  label: 'EASY',   badge: 'bg-green-950 text-green-400 border border-green-800',    desc: 'อุกกาบาตช้า' },
  { levels: '3–4',  label: 'NORMAL', badge: 'bg-cyan-950 text-cyan-400 border border-cyan-800',       desc: 'UFO เริ่มมา' },
  { levels: '5–6',  label: 'HARD',   badge: 'bg-yellow-950 text-yellow-400 border border-yellow-800', desc: 'ศัตรูยิงกลับ' },
  { levels: '7–9',  label: 'EXPERT', badge: 'bg-orange-950 text-orange-400 border border-orange-800', desc: 'Boss ทุกด่าน' },
  { levels: '10+',  label: 'INSANE', badge: 'bg-pink-950 text-pink-400 border border-pink-800',       desc: 'ไม่มีที่สิ้นสุด' },
]

const controls = [
  { icon: '🖱️', k: 'เมาส์',  desc: 'เคลื่อนที่เรือ' },
  { icon: '👆', k: 'แตะ',    desc: 'บนมือถือ' },
  { icon: '⏸', k: 'P / Esc', desc: 'หยุดชั่วคราว' },
]

function getTier(lv) { return TIERS.find(t => lv >= t.minLevel && lv <= t.maxLevel) || TIERS[TIERS.length - 1] }

// ─── Difficulty params (computed from level) ───────────────────────────────
function getDiffParams(lv) {
  const t = getTier(lv)
  const within = lv - t.minLevel  // 0-based within tier
  const base = {
    enemySpeed:    1.2 + lv * 0.18,
    spawnInterval: Math.max(500, 2500 - lv * 140),
    waveSize:      5 + lv * 2,
    asteroidBig:   0.2 + Math.min(lv * 0.03, 0.2),
    ufoChance:     lv >= 3 ? Math.min(0.1 + (lv - 3) * 0.06, 0.45) : 0,
    dartChance:    lv >= 2 ? Math.min(0.1 + (lv - 2) * 0.04, 0.35) : 0,
    kamikazeChance:lv >= 5 ? Math.min(0.05 + (lv - 5) * 0.04, 0.3) : 0,
    ufoShootRate:  Math.max(400, 2000 - lv * 110),
    enemyBulletSpd:4.5 + lv * 0.4,
    bossEveryN:    lv >= 7 ? 1 : 3,   // every N levels
    bossHp:        25 + lv * 10,
    puDropRate:    Math.max(0.12, 0.28 - lv * 0.01),
    pointMult:     1 + Math.floor((lv - 1) / 2) * 0.5,
  }
  return base
}

function getNextLevelHints(lv) {
  const hints = []
  const p = getDiffParams(lv)
  const prev = getDiffParams(lv - 1)
  if (lv === 3) hints.push('UFO เริ่มปรากฏ — เคลื่อนที่แบบซิกแซก')
  if (lv === 5) hints.push('ศัตรูยิงลูกหลงกลับ!')
  if (lv === 7) hints.push('⚠️ Boss ทุกด่านตั้งแต่นี้ไป!')
  if (lv === 10) hints.push('🔥 โหมด INSANE — ทุกอย่างเร็วและแน่นขึ้น')
  if (lv >= 5 && p.kamikazeChance > prev.kamikazeChance) hints.push('Kamikaze dart — พุ่งตรงมาหาเรือ!')
  hints.push(`ความเร็วศัตรู +${((p.enemySpeed - prev.enemySpeed) * 100).toFixed(0)}%`)
  hints.push(`จำนวนศัตรูต่อด่าน: ${p.waveSize} ตัว`)
  if (hints.length < 2) hints.push('คะแนนต่อตัวสูงขึ้น!')
  return hints.slice(0, 3)
}

// ─── Vue state ────────────────────────────────────────────────────────────
const canvasRef = ref(null)
const rootEl = ref(null)
const gstate = ref('start')
const score = ref(0)
const lives = ref(MAX_LIVES)
const level = ref(1)
const combo = ref(1)
const shieldHP = ref(0)
const levelBonus = ref(0)
const newRecord = ref(false)
const highScore = ref(Number(localStorage.getItem('ss2_hs') || 0))
const bestLevel = ref(Number(localStorage.getItem('ss2_bl') || 1))
const totalKills = ref(Number(localStorage.getItem('ss2_tk') || 0))
const bossKills = ref(Number(localStorage.getItem('ss2_bk') || 0))
const activePU = reactive([])
const bossHpPct = ref(-1)
const waveKilled = ref(0)
const waveTotal = ref(0)
const shakeActive = ref(false)

const diffBadgeClass = computed(() => getTier(level.value).badge)
const diffLabel = computed(() => getTier(level.value).name)
const diffGradient = computed(() => getTier(level.value).color)
const nextDiffLabel = computed(() => getTier(level.value).name)
const nextDiffBadgeTextClass = computed(() => {
  const t = getTier(level.value)
  return t.badge.split(' ').find(c => c.startsWith('text-')) || 'text-cyan-400'
})
const nextDiffBorderClass = computed(() => {
  const t = getTier(level.value)
  return t.badge.split(' ').find(c => c.startsWith('border-')) || 'border-cyan-800'
})
const nextDiffBtnClass = computed(() => {
  const m = { EASY: 'border-green-500 text-green-400 bg-green-950/60 hover:bg-green-900/80',
              NORMAL: 'border-cyan-500 text-cyan-400 bg-cyan-950/60 hover:bg-cyan-900/80',
              HARD: 'border-yellow-500 text-yellow-400 bg-yellow-950/60 hover:bg-yellow-900/80',
              EXPERT: 'border-orange-500 text-orange-400 bg-orange-950/60 hover:bg-orange-900/80',
              INSANE: 'border-pink-500 text-pink-400 bg-pink-950/60 hover:bg-pink-900/80' }
  return m[getTier(level.value).name] || m.NORMAL
})
const nextLevelHints = computed(() => getNextLevelHints(level.value))
const waveProgressPct = computed(() => waveTotal.value > 0 ? (waveKilled.value / waveTotal.value * 100) : 0)

// ─── Canvas / game engine ──────────────────────────────────────────────────
let ctx = null
let raf = null
let lastTime = 0

let player = null
let bullets = []
let enemies = []
let particles = []
let powerups = []
let stars = []
let floats = []
let bossRef = null

let shootTimer = 0
let spawnTimer = 0
let dp = {}  // difficulty params
let bossActive = false
let puIdCtr = 0
let sessionKills = 0
let sessionBossKills = 0
let multiShot = false
let speedBoost = false
let comboTimer = 0
let shake = 0

// ─── Stars ────────────────────────────────────────────────────────────────
function initStars() {
  stars = []
  for (let i = 0; i < 130; i++) {
    const layer = Math.floor(Math.random() * 3)
    stars.push({
      x: Math.random() * VW, y: Math.random() * VH,
      s: layer === 2 ? 2.2 : layer === 1 ? 1.3 : 0.7,
      spd: layer === 2 ? 2.2 : layer === 1 ? 1 : 0.4,
      a: 0.4 + Math.random() * 0.6,
      t: Math.random() * Math.PI * 2,
    })
  }
}

// ─── Player ───────────────────────────────────────────────────────────────
function resetPlayer() {
  player = { x: VW / 2, y: VH - 90, w: 38, h: 48, tx: VW / 2, inv: 0 }
  shieldHP.value = 0
  multiShot = false
  speedBoost = false
}

// ─── Enemy factories ──────────────────────────────────────────────────────
function spawnAsteroid() {
  const big = Math.random() < dp.asteroidBig
  const r = big ? 32 + Math.random() * 10 : 14 + Math.random() * 10
  const sides = 7 + Math.floor(Math.random() * 5)
  const verts = []
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2
    verts.push({ x: Math.cos(a) * r * (0.65 + Math.random() * 0.35), y: Math.sin(a) * r * (0.65 + Math.random() * 0.35) })
  }
  enemies.push({
    type: 'asteroid', x: r + Math.random() * (VW - r * 2), y: -r - 10,
    vx: (Math.random() - 0.5) * 2.5, vy: dp.enemySpeed * (big ? 0.7 : 1),
    r, verts, angle: Math.random() * Math.PI * 2, rotSpd: (Math.random() - 0.5) * 0.05,
    hp: big ? 3 : 1, maxHp: big ? 3 : 1, pts: big ? 30 : 10, dead: false,
  })
}

function spawnUFO() {
  const left = Math.random() < 0.5
  const hp = 2 + Math.floor(level.value / 2)
  enemies.push({
    type: 'ufo',
    x: left ? -45 : VW + 45, y: 80 + Math.random() * 240,
    vx: (left ? 1 : -1) * dp.enemySpeed * 0.85,
    vy: 0.4, sineT: 0, sineAmp: 22 + Math.random() * 20,
    w: 54, h: 28, hp, maxHp: hp, pts: 50, shootTimer: 60 + Math.random() * 60, dead: false,
  })
}

function spawnDart(kamikaze = false) {
  const tx = player ? player.x : VW / 2
  const ty = player ? player.y : VH / 2
  const sx = 30 + Math.random() * (VW - 60)
  const sy = -30
  const spd = dp.enemySpeed * (kamikaze ? 1.8 : 1.2)
  const dx = tx - sx, dy = ty - sy
  const d = Math.sqrt(dx * dx + dy * dy)
  enemies.push({
    type: 'dart',
    x: sx, y: sy,
    vx: kamikaze ? dx / d * spd : (Math.random() - 0.5) * 3,
    vy: kamikaze ? dy / d * spd : spd,
    w: 18, h: 32, hp: 1, maxHp: 1, pts: kamikaze ? 40 : 25,
    kamikaze, angle: kamikaze ? Math.atan2(dy, dx) - Math.PI / 2 : 0,
    dead: false,
  })
}

function spawnBoss() {
  const hp = dp.bossHp
  const b = {
    type: 'boss', x: VW / 2, y: -120, targetY: 105,
    vx: 1.6 + level.value * 0.05, vy: 1.5,
    w: 140, h: 100, hp, maxHp: hp,
    pts: 800 + level.value * 100,
    t: 0, phase: 0, shootTimer: 50, dead: false,
  }
  enemies.push(b)
  bossRef = b
  bossActive = true
  bossHpPct.value = 100
}

function fireBullet(x, y, vx, vy, owner, color, w = 4, h = 16) {
  bullets.push({ x, y, vx, vy, owner, color, w, h, dead: false })
}

function burst(x, y, color, n = 14, spd = 4, big = false) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2
    const s = spd * (0.4 + Math.random() * 0.8)
    particles.push({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      color, size: big ? 3 + Math.random() * 4 : 1.5 + Math.random() * 3,
      life: 45 + Math.random() * 30, maxLife: 75, dead: false,
    })
  }
}

function addFloat(x, y, text, color = '#ffff88') {
  floats.push({ x, y, text, color, life: 55, maxLife: 55, vy: -1.2, dead: false })
}

// ─── Power-ups ─────────────────────────────────────────────────────────────
const PU_DEFS = [
  { type: 'multi',  icon: '🔫', color: '#ff9900', label: 'MULTI' },
  { type: 'shield', icon: '🛡️', color: '#00aaff', label: 'SHIELD' },
  { type: 'speed',  icon: '⚡', color: '#ffff00', label: 'SPEED' },
  { type: 'life',   icon: '❤️', color: '#ff4488', label: 'LIFE' },
  { type: 'bomb',   icon: '💣', color: '#ff6600', label: 'BOMB' },
]
const PU_DUR = 8000

function maybeDropPU(x, y) {
  if (Math.random() > dp.puDropRate) return
  // At higher levels drop more useful PUs
  let pool = [...PU_DEFS]
  if (level.value >= 5) pool = [...pool, PU_DEFS[0], PU_DEFS[1]]  // weight multi+shield
  const def = pool[Math.floor(Math.random() * pool.length)]
  powerups.push({ ...def, x, y, vy: 1.6, angle: 0, w: 26, h: 26, dead: false })
}

function applyPU(type) {
  if (type === 'life') {
    if (lives.value < MAX_LIVES) lives.value++
    addFloat(player.x, player.y - 40, '+LIFE ❤️', '#ff4488')
    return
  }
  if (type === 'bomb') {
    // Screen-clear bomb
    const cleared = enemies.filter(e => e.type !== 'boss').length
    for (const e of enemies) {
      if (e.type !== 'boss') {
        e.dead = true
        burst(e.x, e.y, '#ff6600', 8)
      } else {
        e.hp -= 8
      }
    }
    waveKilled.value = Math.min(waveKilled.value + cleared, waveTotal.value)
    score.value += cleared * 15 * combo.value
    addFloat(player.x, player.y - 50, `BOOM! ×${cleared}`, '#ff6600')
    triggerShake(16)
    return
  }
  const idx = activePU.findIndex(p => p.type === type)
  if (idx !== -1) activePU.splice(idx, 1)
  const id = ++puIdCtr
  const def = PU_DEFS.find(p => p.type === type)
  activePU.push({ id, type, icon: def.icon, color: def.color, label: def.label, t: PU_DUR, max: PU_DUR })
  if (type === 'multi') multiShot = true
  if (type === 'shield') shieldHP.value = 3
  if (type === 'speed') speedBoost = true
}

function tickPU(dt) {
  for (let i = activePU.length - 1; i >= 0; i--) {
    activePU[i].t -= dt
    if (activePU[i].t <= 0) {
      const t = activePU[i].type
      activePU.splice(i, 1)
      if (t === 'multi') multiShot = false
      if (t === 'speed') speedBoost = false
    }
  }
}

// ─── Shake ────────────────────────────────────────────────────────────────
function triggerShake(amt) {
  shake = amt
  shakeActive.value = true
  setTimeout(() => { shakeActive.value = false }, 200)
}

// ─── Spawn wave ──────────────────────────────────────────────────────────
let spawnInterval = 2000
let waveLeft = 0
let waveSize = 0

function startWave() {
  dp = getDiffParams(level.value)
  bossActive = false
  bossRef = null
  bossHpPct.value = -1
  const isBoss = level.value % dp.bossEveryN === 0
  if (isBoss) {
    gstate.value = 'bosswarning'
    setTimeout(() => {
      if (gstate.value === 'bosswarning') {
        gstate.value = 'playing'
        spawnBoss()
        waveSize = 1; waveLeft = 1
        waveTotal.value = 1; waveKilled.value = 0
      }
    }, 2400)
  } else {
    waveSize = dp.waveSize
    waveLeft = waveSize
    waveTotal.value = waveSize
    waveKilled.value = 0
    spawnInterval = dp.spawnInterval
    spawnTimer = 0
  }
}

function spawnNext() {
  if (waveLeft <= 0 || bossActive) return
  // Choose type based on chances
  const r = Math.random()
  const kam = dp.kamikazeChance
  const dart = dp.dartChance
  const ufo = dp.ufoChance
  if (r < kam) spawnDart(true)
  else if (r < kam + dart) spawnDart(false)
  else if (r < kam + dart + ufo) spawnUFO()
  else spawnAsteroid()
  waveLeft--
}

// ─── Collisions ───────────────────────────────────────────────────────────
function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return Math.abs(ax - bx) < (aw + bw) / 2 && Math.abs(ay - by) < (ah + bh) / 2
}
function circleRect(cx, cy, cr, rx, ry, rw, rh) {
  const dx = Math.abs(cx - rx), dy = Math.abs(cy - ry)
  if (dx > rw / 2 + cr || dy > rh / 2 + cr) return false
  if (dx <= rw / 2 || dy <= rh / 2) return true
  return (dx - rw / 2) ** 2 + (dy - rh / 2) ** 2 <= cr * cr
}

// ─── Update ───────────────────────────────────────────────────────────────
function update(dt) {
  shake = Math.max(0, shake - 1)

  // Stars scroll
  for (const s of stars) {
    s.y += s.spd; s.t += 0.04
    if (s.y > VH + 4) s.y = -4
  }

  // Player move (smooth)
  if (player) {
    player.x += (player.tx - player.x) * 0.14
    player.x = Math.max(player.w / 2, Math.min(VW - player.w / 2, player.x))
    if (player.inv > 0) player.inv -= dt
  }

  // Combo decay
  if (comboTimer > 0) { comboTimer -= dt; if (comboTimer <= 0) combo.value = 1 }

  // Auto fire
  const fireRate = multiShot ? 160 : 240
  shootTimer -= dt
  if (shootTimer <= 0 && player) {
    shootTimer = fireRate
    const cx = player.x, ty2 = player.y - player.h / 2 - 8
    if (multiShot) {
      fireBullet(cx - 13, ty2, -0.6, -14, 'player', '#00ffff')
      fireBullet(cx,      ty2,  0,   -15, 'player', '#ffffff')
      fireBullet(cx + 13, ty2,  0.6, -14, 'player', '#00ffff')
    } else {
      fireBullet(cx, ty2, 0, -15, 'player', '#00ccff')
    }
  }

  // Spawn
  if (!bossActive && waveLeft > 0) {
    spawnTimer -= dt
    if (spawnTimer <= 0) { spawnTimer = spawnInterval; spawnNext() }
  }

  // Bullets
  for (const b of bullets) {
    b.x += b.vx; b.y += b.vy
    if (b.y < -30 || b.y > VH + 30 || b.x < -30 || b.x > VW + 30) b.dead = true
  }

  // Enemies update
  for (const e of enemies) {
    if (e.type === 'asteroid') {
      e.x += e.vx; e.y += e.vy; e.angle += e.rotSpd
      if (e.y > VH + 70) e.dead = true
    } else if (e.type === 'ufo') {
      e.sineT += 0.04
      e.x += e.vx + Math.sin(e.sineT) * e.sineAmp * 0.04
      e.y += e.vy
      if (e.x < -90 || e.x > VW + 90 || e.y > VH + 50) e.dead = true
      if (player && level.value >= 3) {
        e.shootTimer -= dt
        if (e.shootTimer <= 0) {
          e.shootTimer = dp.ufoShootRate
          const dx = player.x - e.x, dy = player.y - e.y
          const d = Math.sqrt(dx * dx + dy * dy)
          fireBullet(e.x, e.y + e.h / 2, dx / d * dp.enemyBulletSpd, dy / d * dp.enemyBulletSpd, 'enemy', '#ff4444', 5, 12)
        }
      }
    } else if (e.type === 'dart') {
      if (e.kamikaze && player) {
        // Home toward player slightly
        const dx = player.x - e.x, dy = player.y - e.y
        const d = Math.sqrt(dx * dx + dy * dy) + 0.001
        e.vx += dx / d * 0.2; e.vy += dy / d * 0.2
        const spd = Math.sqrt(e.vx * e.vx + e.vy * e.vy)
        if (spd > dp.enemySpeed * 2.2) { e.vx *= dp.enemySpeed * 2.2 / spd; e.vy *= dp.enemySpeed * 2.2 / spd }
        e.angle = Math.atan2(e.vy, e.vx) - Math.PI / 2
      }
      e.x += e.vx; e.y += e.vy
      if (e.y > VH + 50 || e.x < -50 || e.x > VW + 50) e.dead = true
    } else if (e.type === 'boss') {
      e.t += dt
      if (e.phase === 0) {
        e.y += Math.min(e.vy, Math.max(0.3, (e.targetY - e.y) * 0.06))
        if (e.y >= e.targetY) { e.phase = 1 }
      } else {
        e.x += e.vx
        if (e.x > VW - e.w / 2 - 8) e.vx = -Math.abs(e.vx)
        if (e.x < e.w / 2 + 8) e.vx = Math.abs(e.vx)
        e.shootTimer -= dt
        if (e.shootTimer <= 0) {
          e.shootTimer = Math.max(500, 2200 - level.value * 70)
          const pattern = level.value >= 7 ? 'spread5' : 'spread3'
          if (pattern === 'spread5') {
            for (let i = -2; i <= 2; i++)
              fireBullet(e.x + i * 22, e.y + e.h / 2,
                i * 0.9 + (player ? (player.x - e.x) / VH * 1.5 : 0),
                dp.enemyBulletSpd, 'enemy', '#ff6600', 6, 14)
          } else {
            for (let i = -1; i <= 1; i++)
              fireBullet(e.x + i * 30, e.y + e.h / 2,
                i * 1.2 + (player ? (player.x - e.x) / VH * 1.5 : 0),
                dp.enemyBulletSpd, 'enemy', '#ff6600', 6, 14)
          }
        }
      }
      bossHpPct.value = e.hp / e.maxHp * 100
    }
  }

  // Powerup drift
  for (const p of powerups) { p.y += p.vy; p.angle += 0.06; if (p.y > VH + 40) p.dead = true }

  // Active PU timers
  tickPU(dt)

  // Particles
  for (const p of particles) {
    p.x += p.vx; p.y += p.vy; p.vy += 0.07; p.vx *= 0.97; p.life--
    if (p.life <= 0) p.dead = true
  }

  // Floats
  for (const f of floats) { f.y += f.vy; f.life--; if (f.life <= 0) f.dead = true }

  // ── Player bullets vs enemies ──────────────────────────────────────────
  for (const b of bullets) {
    if (b.dead || b.owner !== 'player') continue
    for (const e of enemies) {
      if (e.dead) continue
      const hit = e.type === 'asteroid'
        ? circleRect(b.x, b.y, 3, e.x, e.y, e.r * 2, e.r * 2)
        : rectOverlap(b.x, b.y, b.w, b.h, e.x, e.y, e.w, e.h)
      if (hit) {
        b.dead = true
        e.hp--
        // Small spark on hit
        particles.push({ x: b.x, y: b.y, vx: (Math.random()-.5)*3, vy: (Math.random()-.5)*3, color: '#aaffff', size: 2, life: 12, maxLife: 12, dead: false })
        if (e.hp <= 0) {
          e.dead = true
          const pts = Math.round(e.pts * combo.value * dp.pointMult)
          score.value += pts
          combo.value = Math.min(10, combo.value + 1)
          comboTimer = 3500
          sessionKills++
          waveKilled.value = Math.min(waveKilled.value + 1, waveTotal.value)
          addFloat(e.x, e.y, `+${pts}`, combo.value > 3 ? '#ff9900' : '#ffff88')
          const ec = { boss: '#ff4400', ufo: '#44ff88', dart: '#ff4444', asteroid: '#ffaa44' }[e.type] || '#ffaa44'
          burst(e.x, e.y, ec, e.type === 'boss' ? 35 : 14, 4, e.type === 'boss')
          burst(e.x, e.y, '#ffffff', 6, 2)
          if (e.type === 'boss') {
            sessionBossKills++
            bossActive = false; bossRef = null; bossHpPct.value = -1
            // Drop 3 power-ups
            for (let i = 0; i < 3; i++) {
              const def = PU_DEFS[i % 4]
              setTimeout(() => {
                if (player) powerups.push({ ...def, x: e.x + (i - 1) * 45, y: e.y + 20, vy: 1.5, angle: 0, w: 26, h: 26, dead: false })
              }, i * 180)
            }
          } else {
            maybeDropPU(e.x, e.y)
          }
        }
        break
      }
    }
  }

  // ── Enemy hits player ──────────────────────────────────────────────────
  if (player && player.inv <= 0) {
    for (const b of bullets) {
      if (b.dead || b.owner !== 'enemy') continue
      if (rectOverlap(b.x, b.y, b.w, b.h, player.x, player.y, player.w * 0.85, player.h * 0.85)) {
        b.dead = true; hitPlayer(); break
      }
    }
    for (const e of enemies) {
      if (e.dead) continue
      const hit = e.type === 'asteroid'
        ? circleRect(player.x, player.y, player.w / 2 * 0.8, e.x, e.y, e.r * 2, e.r * 2)
        : rectOverlap(player.x, player.y, player.w * 0.8, player.h * 0.8, e.x, e.y, e.w * 0.8, e.h * 0.8)
      if (hit) {
        hitPlayer(); e.hp -= 2
        if (e.hp <= 0) {
          e.dead = true; burst(e.x, e.y, '#ffaa44', 10)
          waveKilled.value = Math.min(waveKilled.value + 1, waveTotal.value)
          if (e.type === 'boss') { bossActive = false; bossRef = null; bossHpPct.value = -1 }
        }
        break
      }
    }
  }

  // ── Powerup pickup ─────────────────────────────────────────────────────
  if (player) {
    for (const p of powerups) {
      if (p.dead) continue
      if (rectOverlap(p.x, p.y, p.w, p.h, player.x, player.y, player.w, player.h)) {
        p.dead = true; applyPU(p.type)
        burst(p.x, p.y, p.color, 10, 3); addFloat(p.x, p.y - 20, p.label, p.color)
      }
    }
  }

  // Cleanup
  bullets   = bullets.filter(b => !b.dead)
  enemies   = enemies.filter(e => !e.dead)
  particles = particles.filter(p => !p.dead)
  powerups  = powerups.filter(p => !p.dead)
  floats    = floats.filter(f => !f.dead)

  // ── Wave complete? ─────────────────────────────────────────────────────
  if (gstate.value === 'playing' && enemies.length === 0 && waveLeft === 0 && !bossActive) {
    const bonus = level.value * 150
    levelBonus.value = bonus; score.value += bonus
    level.value++
    gstate.value = 'levelup'
  }
}

// ─── Hit player ───────────────────────────────────────────────────────────
function hitPlayer() {
  if (!player || player.inv > 0) return
  if (shieldHP.value > 0) {
    shieldHP.value--
    burst(player.x, player.y, '#00aaff', 12)
    addFloat(player.x, player.y - 30, 'SHIELD BLOCK!', '#00aaff')
    player.inv = 500; triggerShake(5)
    if (shieldHP.value === 0) {
      const i = activePU.findIndex(p => p.type === 'shield')
      if (i !== -1) activePU.splice(i, 1)
    }
    return
  }
  lives.value--; combo.value = 1
  burst(player.x, player.y, '#ff4488', 20); triggerShake(14)
  if (lives.value <= 0) {
    burst(player.x, player.y, '#ffaa44', 28)
    player = null
    // Save stats
    if (score.value > highScore.value) {
      highScore.value = score.value
      localStorage.setItem('ss2_hs', score.value)
      newRecord.value = true
    }
    const bl = Math.max(level.value, Number(localStorage.getItem('ss2_bl') || 1))
    bestLevel.value = bl; localStorage.setItem('ss2_bl', bl)
    totalKills.value += sessionKills; localStorage.setItem('ss2_tk', totalKills.value)
    bossKills.value += sessionBossKills; localStorage.setItem('ss2_bk', bossKills.value)
    setTimeout(() => { gstate.value = 'gameover' }, 800)
  } else {
    player.inv = 2200
    addFloat(player.x, player.y - 40, `${lives.value} LIVES LEFT`, '#ff4488')
  }
}

// ─── Draw ──────────────────────────────────────────────────────────────────
function draw() {
  if (!ctx) return
  const c = ctx
  c.save()
  if (shake > 0.5) c.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake)

  // BG gradient
  const bg = c.createLinearGradient(0, 0, 0, VH)
  bg.addColorStop(0, '#000814'); bg.addColorStop(1, '#001128')
  c.fillStyle = bg; c.fillRect(0, 0, VW, VH)

  // Nebula cloud (subtle, color shifts per tier)
  const tierCol = getTier(level.value).color
  c.globalAlpha = 0.04
  const nb = c.createRadialGradient(VW * 0.3, VH * 0.4, 0, VW * 0.3, VH * 0.4, VW * 0.6)
  nb.addColorStop(0, tierCol); nb.addColorStop(1, 'transparent')
  c.fillStyle = nb; c.fillRect(0, 0, VW, VH)
  c.globalAlpha = 1

  // Stars
  for (const s of stars) {
    c.globalAlpha = s.a * (0.5 + 0.5 * Math.sin(s.t))
    c.fillStyle = '#ffffff'
    c.beginPath(); c.arc(s.x, s.y, s.s, 0, Math.PI * 2); c.fill()
  }
  c.globalAlpha = 1

  // Particles
  for (const p of particles) {
    c.globalAlpha = p.life / p.maxLife
    c.fillStyle = p.color
    c.beginPath(); c.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2); c.fill()
  }
  c.globalAlpha = 1

  // Power-ups
  for (const p of powerups) {
    c.save(); c.translate(p.x, p.y); c.rotate(p.angle)
    c.shadowColor = p.color; c.shadowBlur = 14
    c.fillStyle = p.color + '22'; c.strokeStyle = p.color; c.lineWidth = 1.5
    c.beginPath()
    for (let i = 0; i < 6; i++) {
      const a2 = (i / 6) * Math.PI * 2
      i === 0 ? c.moveTo(Math.cos(a2) * 13, Math.sin(a2) * 13) : c.lineTo(Math.cos(a2) * 13, Math.sin(a2) * 13)
    }
    c.closePath(); c.fill(); c.stroke()
    c.shadowBlur = 0
    c.font = '14px Sarabun'; c.textAlign = 'center'; c.textBaseline = 'middle'
    c.fillText(p.icon, 0, 1)
    c.restore()
  }

  // ── Enemies ─────────────────────────────────────────────────────────────
  for (const e of enemies) {
    c.save(); c.translate(e.x, e.y)
    if (e.type === 'asteroid') {
      c.rotate(e.angle)
      c.shadowColor = '#aa6633'; c.shadowBlur = 8
      c.fillStyle = e.hp > 1 ? '#6a4f2e' : '#8a6040'
      c.strokeStyle = '#c49a6c'; c.lineWidth = 1.5
      c.beginPath()
      e.verts.forEach((v, i) => i === 0 ? c.moveTo(v.x, v.y) : c.lineTo(v.x, v.y))
      c.closePath(); c.fill(); c.stroke()
      c.shadowBlur = 0
      // Cracks for big asteroids
      if (e.maxHp > 1) {
        c.strokeStyle = '#c49a6c55'; c.lineWidth = 0.8
        c.beginPath(); c.moveTo(-e.r * 0.3, -e.r * 0.2); c.lineTo(e.r * 0.2, e.r * 0.3); c.stroke()
        c.beginPath(); c.moveTo(e.r * 0.1, -e.r * 0.4); c.lineTo(-e.r * 0.2, e.r * 0.1); c.stroke()
      }
    } else if (e.type === 'ufo') {
      c.shadowColor = '#44ff88'; c.shadowBlur = 16
      c.fillStyle = '#1a3a1a'; c.strokeStyle = '#44ff88'; c.lineWidth = 1.5
      c.beginPath(); c.ellipse(0, 4, e.w / 2, e.h / 2 * 0.55, 0, 0, Math.PI * 2); c.fill(); c.stroke()
      c.fillStyle = '#2a4a2a'; c.strokeStyle = '#66ff66'; c.lineWidth = 1
      c.beginPath(); c.ellipse(0, -2, e.w * 0.28, e.h * 0.5, 0, Math.PI, 0); c.fill(); c.stroke()
      c.shadowBlur = 0
      const lc = ['#ff4444','#ffff44','#44ff44','#44ffff','#ff44ff']
      for (let i = 0; i < 5; i++) {
        const a2 = (i / 5) * Math.PI * 2 + e.sineT
        c.fillStyle = lc[i]; c.beginPath()
        c.arc(Math.cos(a2) * e.w * 0.38, 4 + Math.sin(a2) * e.h * 0.15, 2.5, 0, Math.PI * 2); c.fill()
      }
      if (e.hp < e.maxHp) {
        const bw = e.w * 0.85
        c.fillStyle = '#440000'; c.fillRect(-bw/2, -e.h/2 - 10, bw, 4)
        c.fillStyle = '#44ff44'; c.fillRect(-bw/2, -e.h/2 - 10, bw * e.hp / e.maxHp, 4)
      }
    } else if (e.type === 'dart') {
      c.rotate(e.angle)
      c.shadowColor = e.kamikaze ? '#ff00ff' : '#ff4444'; c.shadowBlur = 14
      c.fillStyle = e.kamikaze ? '#440044' : '#aa1111'
      c.strokeStyle = e.kamikaze ? '#ff44ff' : '#ff6666'; c.lineWidth = 1.5
      c.beginPath()
      c.moveTo(0, e.h / 2); c.lineTo(-e.w / 2, -e.h / 2)
      c.lineTo(0, -e.h / 2 * 0.5); c.lineTo(e.w / 2, -e.h / 2)
      c.closePath(); c.fill(); c.stroke()
      // Exhaust
      c.shadowBlur = 0
      c.fillStyle = (e.kamikaze ? '#ff00ff' : '#ff6600') + '99'
      c.beginPath()
      c.moveTo(-5, e.h / 2); c.lineTo(5, e.h / 2); c.lineTo(0, e.h / 2 + 10 + Math.random() * 6); c.closePath(); c.fill()
    } else if (e.type === 'boss') {
      const w = e.w, h = e.h
      const pulse = 0.5 + 0.5 * Math.sin(e.t * 0.003)
      c.shadowColor = '#ff3300'; c.shadowBlur = 22 + pulse * 16
      c.fillStyle = '#2a0008'; c.strokeStyle = '#ff3300'; c.lineWidth = 2
      c.beginPath()
      c.moveTo(0, -h / 2); c.lineTo(w / 2, -h * 0.1)
      c.lineTo(w * 0.42, h / 2); c.lineTo(-w * 0.42, h / 2)
      c.lineTo(-w / 2, -h * 0.1); c.closePath(); c.fill(); c.stroke()
      // Core
      c.shadowColor = '#ff0000'; c.shadowBlur = 32
      c.fillStyle = `rgba(255,${60 + pulse * 80},0,${0.8 + pulse * 0.2})`
      c.beginPath(); c.arc(0, 0, 20 + pulse * 7, 0, Math.PI * 2); c.fill()
      // Wing lines
      c.shadowBlur = 8; c.strokeStyle = '#ff6600'; c.lineWidth = 1.5
      for (const sign of [-1, 1]) {
        c.beginPath()
        c.moveTo(sign * 22, -12); c.lineTo(sign * w * 0.42, 0); c.lineTo(sign * w * 0.36, h * 0.3); c.stroke()
      }
      // Cannon dots
      c.shadowBlur = 0; c.fillStyle = '#ff4400'
      for (let i = -2; i <= 2; i++) {
        c.beginPath(); c.arc(i * 24, h / 2 - 8, 4.5, 0, Math.PI * 2); c.fill()
      }
      // Phase indicator
      if (e.phase === 0) {
        c.fillStyle = '#ff660066'
        c.font = 'bold 10px Orbitron, monospace'; c.textAlign = 'center'
        c.fillText('ENTERING...', 0, -h / 2 - 14)
      }
    }
    c.restore()
  }

  // ── Bullets ──────────────────────────────────────────────────────────────
  for (const b of bullets) {
    c.save()
    if (b.owner === 'player') {
      c.shadowColor = '#00ccff'; c.shadowBlur = 12
      c.fillStyle = '#aaffff'
      c.beginPath()
      if (c.roundRect) c.roundRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 2)
      else c.rect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h)
      c.fill()
      c.fillStyle = '#ffffff'
      c.fillRect(b.x - b.w / 2 + 1, b.y - b.h / 2, b.w - 2, 5)
    } else {
      c.shadowColor = b.color; c.shadowBlur = 10
      c.fillStyle = b.color
      c.beginPath(); c.arc(b.x, b.y, b.w / 2 + 1, 0, Math.PI * 2); c.fill()
    }
    c.restore()
  }

  // ── Player ship ─────────────────────────────────────────────────────────
  if (player) {
    const vis = player.inv <= 0 || Math.floor(player.inv / 80) % 2 === 0
    if (vis) {
      c.save(); c.translate(player.x, player.y)
      const w = player.w, h = player.h
      // Engine glow
      c.shadowColor = '#0066ff'; c.shadowBlur = 18
      c.fillStyle = '#0044ff44'
      c.beginPath(); c.ellipse(0, h / 2 + 6, 10, 4, 0, 0, Math.PI * 2); c.fill()
      // Flame
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
      c.lineTo(-w*0.35, h/2); c.lineTo(-w/2, h*0.2); c.closePath(); c.fill(); c.stroke()
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
      c.restore()
    }
  }

  // ── Float texts ─────────────────────────────────────────────────────────
  c.save()
  for (const f of floats) {
    c.globalAlpha = f.life / f.maxLife
    c.shadowColor = f.color; c.shadowBlur = 8
    c.font = 'bold 12px Orbitron, monospace'
    c.fillStyle = f.color; c.textAlign = 'center'
    c.fillText(f.text, f.x, f.y)
  }
  c.globalAlpha = 1; c.restore()

  c.restore()  // end shake
}

// ─── Game loop ────────────────────────────────────────────────────────────
function loop(ts) {
  raf = requestAnimationFrame(loop)
  const dt = Math.min(ts - lastTime, 50)
  lastTime = ts
  if (gstate.value === 'playing') update(dt)
  draw()
}

// ─── Canvas sizing ────────────────────────────────────────────────────────
function resizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const scale = Math.min(window.innerWidth / VW, window.innerHeight / VH)
  canvas.style.width  = Math.round(VW * scale) + 'px'
  canvas.style.height = Math.round(VH * scale) + 'px'
  canvas.style.left   = Math.round((window.innerWidth  - VW * scale) / 2) + 'px'
  canvas.style.top    = Math.round((window.innerHeight - VH * scale) / 2) + 'px'
}

function getPos(cx, cy) {
  const r = canvasRef.value.getBoundingClientRect()
  return { x: (cx - r.left) / r.width * VW, y: (cy - r.top) / r.height * VH }
}

function onMouseMove(e) {
  if (!player || gstate.value !== 'playing') return
  player.tx = getPos(e.clientX, e.clientY).x
}

function onTouchMove(e) {
  if (!player || gstate.value !== 'playing') return
  player.tx = getPos(e.touches[0].clientX, e.touches[0].clientY).x
}

// ─── Game control ─────────────────────────────────────────────────────────
function startGame() {
  bullets = []; enemies = []; particles = []; powerups = []; floats = []
  activePU.length = 0
  resetPlayer()
  score.value = 0; lives.value = MAX_LIVES; level.value = 1
  combo.value = 1; newRecord.value = false; bossActive = false; bossRef = null
  bossHpPct.value = -1; shootTimer = 0; sessionKills = 0; sessionBossKills = 0
  gstate.value = 'playing'
  startWave()
}

function advanceLevel() {
  bullets = []; enemies = []; particles = []; powerups = []; floats = []
  activePU.length = 0
  resetPlayer()
  combo.value = 1; bossActive = false; bossRef = null; bossHpPct.value = -1; shootTimer = 0
  gstate.value = 'playing'
  startWave()
}

function togglePause() {
  if (gstate.value === 'playing') gstate.value = 'paused'
  else if (gstate.value === 'paused') gstate.value = 'playing'
}

// ─── Lifecycle ────────────────────────────────────────────────────────────
onMounted(() => {
  const canvas = canvasRef.value
  canvas.width = VW; canvas.height = VH
  ctx = canvas.getContext('2d')
  initStars(); resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  window.addEventListener('keydown', e => { if (e.key === 'p' || e.key === 'Escape') togglePause() })
  raf = requestAnimationFrame(loop)
})
onUnmounted(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', resizeCanvas)
})
</script>

<style scoped>
canvas { position: absolute; }

.font-orbitron { font-family: 'Orbitron', monospace; }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.bounce-in-enter-active { animation: bounceIn 0.4s cubic-bezier(.68,-.55,.27,1.55); }
.bounce-in-leave-active { transition: opacity 0.2s ease; }
.bounce-in-leave-to { opacity: 0; }
@keyframes bounceIn { from { transform:scale(0.6); opacity:0; } to { transform:scale(1); opacity:1; } }

.slide-in-enter-active { animation: slideIn 0.3s ease-out; }
.slide-in-leave-active { animation: slideIn 0.2s ease-in reverse; }
@keyframes slideIn { from { transform:translateY(-10px); opacity:0; } to { transform:translateY(0); opacity:1; } }

.combo-pop-enter-active { animation: comboPop 0.25s cubic-bezier(.34,1.56,.64,1); }
.combo-pop-leave-active { transition: opacity 0.2s; }
.combo-pop-leave-to { opacity: 0; }
@keyframes comboPop { from { transform:scale(0.5); opacity:0; } to { transform:scale(1); opacity:1; } }

.pu-list-enter-active { animation: puIn 0.2s ease-out; }
.pu-list-leave-active { transition: opacity 0.3s; }
.pu-list-leave-to { opacity:0; }
@keyframes puIn { from { transform:scale(0.7) translateY(8px); opacity:0; } to { transform:scale(1) translateY(0); opacity:1; } }
</style>
