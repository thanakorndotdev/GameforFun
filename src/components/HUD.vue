<template>
  <div class="absolute top-0 left-0 right-0 z-10 flex items-start justify-between px-4 pt-2 pb-6
              bg-gradient-to-b from-black/80 to-transparent pointer-events-none">

    <!-- Score + Combo -->
    <div class="hud-panel">
      <div class="hud-label">SCORE</div>
      <div class="hud-value text-xl tabular-nums">{{ score.toLocaleString() }}</div>
      <Transition name="combo-pop">
        <div v-if="combo > 1" key="combo" class="font-orbitron text-xs mt-0.5"
          :class="combo >= 5 ? 'neon-text-pink animate-flicker' : combo >= 3 ? 'neon-text-orange' : 'text-yellow-400'">
          ×{{ combo }} COMBO!
        </div>
      </Transition>
    </div>

    <!-- Level + Difficulty -->
    <div class="hud-panel">
      <div class="hud-label">LEVEL</div>
      <div class="hud-value">{{ level }}</div>
      <div class="difficulty-badge mt-1" :class="diffBadgeClass">{{ diffLabel }}</div>
    </div>

    <!-- Lives + Shield -->
    <div class="hud-panel items-end">
      <div class="hud-label">LIVES</div>
      <div class="flex gap-1 mt-0.5">
        <span v-for="i in MAX_LIVES" :key="i" class="text-lg transition-all duration-300"
          :class="i <= lives ? 'neon-text-pink' : 'text-gray-800'">♥</span>
      </div>
      <div v-if="shieldHP > 0" class="flex items-center gap-1 mt-1">
        <span class="text-blue-400 text-xs font-orbitron">SHIELD</span>
        <div class="flex gap-0.5">
          <span v-for="s in 3" :key="s" class="text-sm" :class="s <= shieldHP ? 'text-blue-400' : 'text-gray-800'">▮</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Wave progress bar -->
  <div class="absolute top-16 left-4 right-4 z-10 pointer-events-none">
    <div class="flex items-center gap-2 mb-1">
      <span class="font-orbitron text-[9px] text-cyan-800 tracking-widest">WAVE</span>
      <div class="flex-1 h-1 bg-gray-900 rounded-full overflow-hidden">
        <div class="h-full rounded-full transition-all duration-500"
          :style="{ width: waveProgressPct + '%', background: diffGradient }" />
      </div>
      <span class="font-orbitron text-[9px] text-cyan-800 tracking-widest">{{ waveKilled }}/{{ waveTotal }}</span>
    </div>
  </div>
</template>

<script setup>
import { MAX_LIVES } from '../game/constants.js'
import { score, lives, level, combo, shieldHP, diffBadgeClass, diffLabel, diffGradient, waveKilled, waveTotal, waveProgressPct } from '../game/store.js'
</script>
