import { state } from '../state.js'
import { score, level, highScore, bestLevel, totalKills, bossKills, newRecord, runStats } from '../store.js'

const RATINGS = [
  { min: 0, label: 'ROOKIE',    color: '#888880' },
  { min: 2, label: 'PILOT',     color: '#5DCAA5' },
  { min: 4, label: 'ACE',       color: '#00ccff' },
  { min: 5, label: 'VETERAN',   color: '#ffcc00' },
  { min: 6, label: 'ELITE',     color: '#ff9900' },
  { min: 7, label: 'LEGENDARY', color: '#ff4488' },
]

export function useStats() {
  function calcRunStats() {
    const elapsed    = (Date.now() - state.runStartTime) / 1000
    const totalShots = state.runBulletsFired + state.runChargeUsed
    const accuracy   = totalShots > 0 ? Math.round((state.sessionKills / totalShots) * 100) : 0
    const dps        = elapsed > 0 ? Math.round(score.value / elapsed) : 0

    let stars = 0
    if (accuracy >= 60)          stars++
    if (accuracy >= 85)          stars++
    if (state.runMaxCombo >= 5)  stars++
    if (state.runMaxCombo >= 8)  stars++
    if (state.runTimesHit === 0) stars += 2
    else if (state.runTimesHit <= 1) stars++
    if (state.sessionBossKills > 0) stars++

    const r = [...RATINGS].reverse().find(r => stars >= r.min) || RATINGS[0]

    runStats.survivalSec  = Math.round(elapsed)
    runStats.accuracy     = accuracy
    runStats.dps          = dps
    runStats.maxCombo     = state.runMaxCombo
    runStats.bulletsTotal = totalShots
    runStats.chargeShots  = state.runChargeUsed
    runStats.timesHit     = state.runTimesHit
    runStats.shieldBlocks = state.runShieldBlocks
    runStats.puCollected  = state.runPUCollected
    runStats.rating       = r.label
    runStats.ratingColor  = r.color
  }

  function persistStats() {
    if (score.value > highScore.value) {
      highScore.value = score.value
      localStorage.setItem('ss2_hs', score.value)
      newRecord.value = true
    }
    const bl = Math.max(level.value, Number(localStorage.getItem('ss2_bl') || 1))
    bestLevel.value = bl
    localStorage.setItem('ss2_bl', bl)
    totalKills.value += state.sessionKills
    localStorage.setItem('ss2_tk', totalKills.value)
    bossKills.value += state.sessionBossKills
    localStorage.setItem('ss2_bk', bossKills.value)
  }

  return { calcRunStats, persistStats }
}
