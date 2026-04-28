<template>
  <Transition name="fade">
    <div v-if="gstate === 'gameover'" class="overlay-base bg-black/95">
      <h2 class="font-orbitron font-black text-5xl neon-text-pink">GAME OVER</h2>

      <div class="text-center">
        <div class="font-orbitron font-bold text-4xl neon-text-yellow tabular-nums">{{ score.toLocaleString() }}</div>
        <div class="font-sarabun text-gray-600 text-sm mt-1">ถึงด่านที่ {{ level }}</div>
      </div>

      <Transition name="bounce-in">
        <div v-if="newRecord"
          class="font-orbitron text-sm neon-text-yellow bg-yellow-950/50 border border-yellow-600/50 px-5 py-2 rounded-full animate-glow-pulse">
          🏆 สถิติใหม่!
        </div>
      </Transition>

      <div class="w-80 bg-gray-950 rounded-2xl border border-gray-800 overflow-hidden">
        <!-- Rating header -->
        <div class="px-5 py-3 flex items-center justify-between border-b border-gray-800"
          :style="{ background: runStats.ratingColor + '18', borderColor: runStats.ratingColor + '44' }">
          <div>
            <div class="font-orbitron text-[9px] tracking-[3px] text-gray-600 mb-0.5">PILOT RATING</div>
            <div class="font-orbitron font-black text-xl tracking-widest" :style="{ color: runStats.ratingColor }">
              {{ runStats.rating }}
            </div>
          </div>
          <div class="flex flex-col items-end gap-1">
            <div class="font-orbitron text-[9px] text-gray-700">THIS RUN</div>
            <div class="flex gap-1.5">
              <div v-for="i in 3" :key="i" class="w-2.5 h-2.5 rounded-full border"
                :style="{
                  background: i <= ratingDots ? runStats.ratingColor : 'transparent',
                  borderColor: runStats.ratingColor + '66'
                }" />
            </div>
          </div>
        </div>

        <!-- Survival / DPS / Combo -->
        <div class="grid grid-cols-3 divide-x divide-gray-800 border-b border-gray-800">
          <div class="px-3 py-2.5 text-center">
            <div class="font-orbitron text-[9px] tracking-wider text-gray-600 mb-0.5">เวลา</div>
            <div class="font-orbitron font-bold text-base text-cyan-400 tabular-nums">
              {{ Math.floor(runStats.survivalSec / 60) }}:{{ String(runStats.survivalSec % 60).padStart(2,'0') }}
            </div>
          </div>
          <div class="px-3 py-2.5 text-center">
            <div class="font-orbitron text-[9px] tracking-wider text-gray-600 mb-0.5">DPS</div>
            <div class="font-orbitron font-bold text-base text-yellow-400 tabular-nums">{{ runStats.dps.toLocaleString() }}</div>
          </div>
          <div class="px-3 py-2.5 text-center">
            <div class="font-orbitron text-[9px] tracking-wider text-gray-600 mb-0.5">COMBO</div>
            <div class="font-orbitron font-bold text-base tabular-nums"
              :class="runStats.maxCombo >= 8 ? 'neon-text-pink' : runStats.maxCombo >= 5 ? 'text-orange-400' : 'text-gray-400'">
              ×{{ runStats.maxCombo }}
            </div>
          </div>
        </div>

        <!-- Accuracy bar -->
        <div class="px-4 py-3 border-b border-gray-800">
          <div class="flex justify-between items-center mb-1.5">
            <span class="font-orbitron text-[9px] tracking-widest text-gray-600">ACCURACY</span>
            <span class="font-orbitron text-sm font-bold"
              :class="runStats.accuracy >= 85 ? 'text-green-400' : runStats.accuracy >= 60 ? 'text-yellow-400' : 'text-gray-500'">
              {{ runStats.accuracy }}%
            </span>
          </div>
          <div class="h-1.5 bg-gray-900 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-700"
              :style="{
                width: runStats.accuracy + '%',
                background: runStats.accuracy >= 85 ? '#4ade80' : runStats.accuracy >= 60 ? '#facc15' : '#6b7280'
              }" />
          </div>
          <div class="flex justify-between mt-1">
            <span class="font-orbitron text-[8px] text-gray-700">ยิง {{ runStats.bulletsTotal }} นัด</span>
            <span class="font-orbitron text-[8px] text-gray-700">Charge {{ runStats.chargeShots }} ครั้ง</span>
          </div>
        </div>

        <!-- Stat grid -->
        <div class="grid grid-cols-2 divide-x divide-gray-800">
          <div class="p-3 space-y-2.5">
            <StatRow label="ศัตรูกำจัด" :value="sessionKills" color="text-orange-400" />
            <StatRow label="Boss kill"  :value="sessionBossKills" :color="sessionBossKills > 0 ? 'text-red-400' : 'text-gray-700'" />
            <StatRow label="PU เก็บได้" :value="runStats.puCollected" color="text-purple-400" />
          </div>
          <div class="p-3 space-y-2.5">
            <StatRow label="โดนยิง"
              :value="runStats.timesHit === 0 ? 'NO HIT!' : runStats.timesHit + ' ครั้ง'"
              :color="runStats.timesHit === 0 ? 'text-green-400' : runStats.timesHit <= 2 ? 'text-yellow-400' : 'text-red-400'" />
            <StatRow label="Shield กัน" :value="runStats.shieldBlocks" color="text-cyan-500" />
            <StatRow label="ด่านที่ถึง" :value="level" color="text-cyan-400" />
          </div>
        </div>

        <!-- All-time footer -->
        <div class="px-4 py-2.5 bg-gray-900/60 border-t border-gray-800 flex justify-between items-center">
          <span class="font-orbitron text-[8px] text-gray-700 tracking-widest">ALL-TIME</span>
          <div class="flex gap-4">
            <div class="text-right">
              <div class="font-orbitron text-[8px] text-gray-700">สถิติ</div>
              <div class="font-orbitron text-[10px] text-yellow-700">{{ highScore.toLocaleString() }}</div>
            </div>
            <div class="text-right">
              <div class="font-orbitron text-[8px] text-gray-700">ด่านสูงสุด</div>
              <div class="font-orbitron text-[10px] text-cyan-800">{{ bestLevel }}</div>
            </div>
            <div class="text-right">
              <div class="font-orbitron text-[8px] text-gray-700">ฆ่ารวม</div>
              <div class="font-orbitron text-[10px] text-orange-900">{{ (totalKills + sessionKills).toLocaleString() }}</div>
            </div>
          </div>
        </div>
      </div>

      <button @click="$emit('restart')"
        class="btn-neon border-neon-blue neon-text-blue bg-blue-950/60 hover:bg-blue-900/80 text-sm">
        🔄 เล่นใหม่
      </button>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { gstate, score, level, newRecord, runStats, highScore, bestLevel, totalKills } from '../../game/store.js'
import { state } from '../../game/state.js'

// Expose session counters from raw state for the footer
const sessionKills     = computed(() => state.sessionKills)
const sessionBossKills = computed(() => state.sessionBossKills)

const ratingDots = computed(() => {
  const order = ['ROOKIE','PILOT','ACE','VETERAN','ELITE','LEGENDARY']
  return Math.ceil((order.indexOf(runStats.rating) / 5) * 3)
})

defineEmits(['restart'])
</script>

<script>
// Tiny inline sub-component so we don't need a separate file
const StatRow = {
  props: ['label','value','color'],
  template: `<div class="flex justify-between items-center">
    <span class="font-orbitron text-[9px] text-gray-600">{{ label }}</span>
    <span class="font-orbitron text-xs" :class="color">{{ value }}</span>
  </div>`
}
export default { components: { StatRow } }
</script>
