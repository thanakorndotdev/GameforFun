import { VW, VH } from './constants.js'

// All raw game state in one object.
// Composables mutate this directly — no Vue reactivity needed for canvas rendering.
export const state = {
  // Canvas context
  ctx: null,
  raf: null,
  lastTime: 0,

  // Game objects
  player: null,
  bullets: [],
  enemies: [],
  particles: [],
  powerups: [],
  floats: [],
  bossRef: null,
  px: null,           // parallax system

  // Timers
  shootTimer: 0,
  spawnTimer: 0,
  spawnInterval: 2000,
  waveLeft: 0,
  waveSize: 0,

  // Flags
  bossActive: false,

  // Player derived state
  multiShot: false,
  speedBoost: false,

  // Input
  mouse: { x: VW / 2, y: VH / 2, visible: false },
  charge: { active: false, t: 0, cooldown: 0 },

  // Effects
  shake: 0,
  screenFlash: { alpha: 0, color: '#ffffff' },

  // Current difficulty params (set at wave start)
  dp: {},

  // Session counters (reset each game)
  sessionKills: 0,
  sessionBossKills: 0,
  comboTimer: 0,
  formationIdCtr: 0,

  // Run stat trackers (reset each game)
  runStartTime: 0,
  runBulletsFired: 0,
  runChargeUsed: 0,
  runTimesHit: 0,
  runShieldBlocks: 0,
  runPUCollected: 0,
  runMaxCombo: 1,
}

export function resetState() {
  state.player = null
  state.bullets = []
  state.enemies = []
  state.particles = []
  state.powerups = []
  state.floats = []
  state.bossRef = null
  state.shootTimer = 0
  state.spawnTimer = 0
  state.waveLeft = 0
  state.waveSize = 0
  state.bossActive = false
  state.multiShot = false
  state.speedBoost = false
  state.charge = { active: false, t: 0, cooldown: 0 }
  state.shake = 0
  state.screenFlash = { alpha: 0, color: '#ffffff' }
  state.sessionKills = 0
  state.sessionBossKills = 0
  state.comboTimer = 0
  state.runStartTime = Date.now()
  state.runBulletsFired = 0
  state.runChargeUsed = 0
  state.runTimesHit = 0
  state.runShieldBlocks = 0
  state.runPUCollected = 0
  state.runMaxCombo = 1
}
