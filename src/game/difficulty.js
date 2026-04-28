export const TIERS = [
  { minLevel: 1,  maxLevel: 2,  name: 'EASY',   color: '#00ff88', badge: 'bg-green-950 text-green-400 border border-green-800' },
  { minLevel: 3,  maxLevel: 4,  name: 'NORMAL', color: '#00ccff', badge: 'bg-cyan-950 text-cyan-400 border border-cyan-800' },
  { minLevel: 5,  maxLevel: 6,  name: 'HARD',   color: '#ffcc00', badge: 'bg-yellow-950 text-yellow-400 border border-yellow-800' },
  { minLevel: 7,  maxLevel: 9,  name: 'EXPERT', color: '#ff6600', badge: 'bg-orange-950 text-orange-400 border border-orange-800' },
  { minLevel: 10, maxLevel: 99, name: 'INSANE', color: '#ff4488', badge: 'bg-pink-950 text-pink-400 border border-pink-800' },
]

export const DIFF_TIERS_DISPLAY = [
  { levels: '1–2',  label: 'EASY',   badge: 'bg-green-950 text-green-400 border border-green-800',    desc: 'อุกกาบาตช้า' },
  { levels: '3–4',  label: 'NORMAL', badge: 'bg-cyan-950 text-cyan-400 border border-cyan-800',       desc: 'UFO เริ่มมา' },
  { levels: '5–6',  label: 'HARD',   badge: 'bg-yellow-950 text-yellow-400 border border-yellow-800', desc: 'ศัตรูยิงกลับ' },
  { levels: '7–9',  label: 'EXPERT', badge: 'bg-orange-950 text-orange-400 border border-orange-800', desc: 'Boss ทุกด่าน' },
  { levels: '10+',  label: 'INSANE', badge: 'bg-pink-950 text-pink-400 border border-pink-800',       desc: 'ไม่มีที่สิ้นสุด' },
]

export const CONTROLS = [
  { icon: '🖱️', k: 'เมาส์', desc: 'เคลื่อนที่เรือ' },
  { icon: '👆', k: 'แตะ',   desc: 'บนมือถือ' },
  { icon: '⏸', k: 'P / Esc', desc: 'หยุดชั่วคราว' },
]

export function getTier(lv) {
  return TIERS.find(t => lv >= t.minLevel && lv <= t.maxLevel) || TIERS[TIERS.length - 1]
}

export function getDiffParams(lv) {
  return {
    enemySpeed:      0.9 + lv * 0.12,                          // ช้าลง, ramp ช้าลง
    spawnInterval:   Math.max(600, 2200 - lv * 120),           // spawn ถี่ขึ้น
    waveSize:        8 + lv * 2,                               // ศัตรูต่อด่านเพิ่มขึ้น
    asteroidBig:     0.15 + Math.min(lv * 0.02, 0.15),        // บิ๊กน้อยลง
    ufoChance:       lv >= 4 ? Math.min(0.08 + (lv - 4) * 0.04, 0.3) : 0,   // มาช้าลง
    dartChance:      lv >= 3 ? Math.min(0.08 + (lv - 3) * 0.03, 0.25) : 0,
    kamikazeChance:  lv >= 6 ? Math.min(0.04 + (lv - 6) * 0.03, 0.2) : 0,   // มาช้ามาก
    formationChance: lv >= 4 ? Math.min(0.06 + (lv - 4) * 0.03, 0.25) : 0,
    ufoShootRate:    Math.max(700, 2800 - lv * 120),           // ยิงช้าลง
    enemyBulletSpd:  3.5 + lv * 0.25,                         // กระสุนช้าลง
    bossEveryN:      lv >= 8 ? 1 : 3,                         // boss ทุกด่านช้าลง
    bossHp:          15 + lv * 4,                              // HP บอสน้อยลง
    puDropRate:      Math.min(0.40, 0.32 + lv * 0.005),       // PU drop บ่อยขึ้น!
    pointMult:       1 + Math.floor((lv - 1) / 2) * 0.5,
  }
}

export function getNextLevelHints(lv) {
  const hints = []
  const p = getDiffParams(lv)
  const prev = getDiffParams(lv - 1)
  if (lv === 3) { hints.push('UFO เริ่มปรากฏ — เคลื่อนที่แบบซิกแซก'); hints.push('Formation enemies — บินเป็นกลุ่ม V, Grid, Diamond!') }
  if (lv === 5) hints.push('ศัตรูยิงลูกหลงกลับ!')
  if (lv === 7) hints.push('⚠️ Boss ทุกด่านตั้งแต่นี้ไป!')
  if (lv === 10) hints.push('🔥 โหมด INSANE — ทุกอย่างเร็วและแน่นขึ้น')
  if (lv >= 5 && p.kamikazeChance > prev.kamikazeChance) hints.push('Kamikaze dart — พุ่งตรงมาหาเรือ!')
  hints.push(`ความเร็วศัตรู +${((p.enemySpeed - prev.enemySpeed) * 100).toFixed(0)}%`)
  hints.push(`จำนวนศัตรูต่อด่าน: ${p.waveSize} ตัว`)
  return hints.slice(0, 3)
}
