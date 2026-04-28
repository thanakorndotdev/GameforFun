import { ref, reactive, computed } from 'vue'
import { MAX_LIVES } from './constants.js'
import { getTier, getNextLevelHints } from './difficulty.js'

// ── Persistent (localStorage) ────────────────────────────────────────────
export const highScore  = ref(Number(localStorage.getItem('ss2_hs') || 0))
export const bestLevel  = ref(Number(localStorage.getItem('ss2_bl') || 1))
export const totalKills = ref(Number(localStorage.getItem('ss2_tk') || 0))
export const bossKills  = ref(Number(localStorage.getItem('ss2_bk') || 0))

// ── Game progress ─────────────────────────────────────────────────────────
export const gstate    = ref('start')   // start | playing | paused | levelup | bosswarning | gameover
export const score     = ref(0)
export const lives     = ref(MAX_LIVES)
export const level     = ref(1)
export const combo     = ref(1)
export const shieldHP  = ref(0)
export const levelBonus = ref(0)
export const newRecord  = ref(false)

// ── HUD signals ───────────────────────────────────────────────────────────
export const activePU    = reactive([])
export const bossHpPct   = ref(-1)
export const bossPhase2  = ref(false)
export const waveKilled  = ref(0)
export const waveTotal   = ref(0)
export const shakeActive = ref(false)

// ── Charge bar ────────────────────────────────────────────────────────────
export const chargeLevel   = ref(0)
export const chargeCooling = ref(false)

// ── Run stats (populated at death) ───────────────────────────────────────
export const runStats = reactive({
  survivalSec: 0, accuracy: 0, dps: 0, maxCombo: 1,
  bulletsTotal: 0, chargeShots: 0, timesHit: 0,
  shieldBlocks: 0, puCollected: 0, rating: '', ratingColor: '',
})

// ── Computed for UI ───────────────────────────────────────────────────────
export const diffBadgeClass = computed(() => getTier(level.value).badge)
export const diffLabel      = computed(() => getTier(level.value).name)
export const diffGradient   = computed(() => getTier(level.value).color)
export const nextDiffLabel  = computed(() => getTier(level.value).name)
export const waveProgressPct = computed(() =>
  waveTotal.value > 0 ? (waveKilled.value / waveTotal.value * 100) : 0)
export const nextLevelHints = computed(() => getNextLevelHints(level.value))

export const nextDiffBadgeTextClass = computed(() => {
  const t = getTier(level.value)
  return t.badge.split(' ').find(c => c.startsWith('text-')) || 'text-cyan-400'
})
export const nextDiffBorderClass = computed(() => {
  const t = getTier(level.value)
  return t.badge.split(' ').find(c => c.startsWith('border-')) || 'border-cyan-800'
})
export const nextDiffBtnClass = computed(() => {
  const m = {
    EASY:   'border-green-500 text-green-400 bg-green-950/60 hover:bg-green-900/80',
    NORMAL: 'border-cyan-500 text-cyan-400 bg-cyan-950/60 hover:bg-cyan-900/80',
    HARD:   'border-yellow-500 text-yellow-400 bg-yellow-950/60 hover:bg-yellow-900/80',
    EXPERT: 'border-orange-500 text-orange-400 bg-orange-950/60 hover:bg-orange-900/80',
    INSANE: 'border-pink-500 text-pink-400 bg-pink-950/60 hover:bg-pink-900/80',
  }
  return m[getTier(level.value).name] || m.NORMAL
})

export const chargeLabelText = computed(() => {
  if (chargeCooling.value)      return 'COOLDOWN'
  if (chargeLevel.value >= 0.99) return '★ RELEASE!'
  if (chargeLevel.value >= 0.7)  return 'CHARGED'
  return 'CHARGING...'
})
export const chargeLabelClass = computed(() => {
  if (chargeCooling.value)       return 'text-gray-600'
  if (chargeLevel.value >= 0.99) return 'text-yellow-300 animate-flicker'
  if (chargeLevel.value >= 0.7)  return 'text-yellow-500'
  if (chargeLevel.value >= 0.3)  return 'text-purple-400'
  return 'text-purple-700'
})
export const chargeBg = computed(() => {
  if (chargeCooling.value)       return '#374151'
  if (chargeLevel.value >= 0.99) return 'linear-gradient(90deg,#facc15,#fff,#facc15)'
  if (chargeLevel.value >= 0.7)  return 'linear-gradient(90deg,#f59e0b,#fde68a)'
  return 'linear-gradient(90deg,#7c3aed,#a855f7)'
})

// ── Reset for new game ────────────────────────────────────────────────────
export function resetStore() {
  gstate.value = 'playing'
  score.value = 0
  lives.value = MAX_LIVES
  level.value = 1
  combo.value = 1
  shieldHP.value = 0
  levelBonus.value = 0
  newRecord.value = false
  activePU.length = 0
  bossHpPct.value = -1
  bossPhase2.value = false
  waveKilled.value = 0
  waveTotal.value = 0
  chargeLevel.value = 0
  chargeCooling.value = false
}
