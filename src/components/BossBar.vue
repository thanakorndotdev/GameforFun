<template>
  <Transition name="slide-in">
    <div v-if="bossHpPct >= 0" class="absolute top-[72px] left-4 right-4 z-10 pointer-events-none">
      <div class="flex items-center gap-2">
        <span class="font-orbitron text-[10px] tracking-widest animate-flicker"
          :class="bossPhase2 ? 'text-purple-400' : 'text-orange-500'">BOSS</span>
        <Transition name="fade">
          <span v-if="bossPhase2"
            class="font-orbitron text-[9px] px-1.5 py-0.5 rounded border animate-flicker"
            style="color:#d946ef;border-color:#d946ef55;background:#4a044e33">PHASE 2</span>
        </Transition>
        <div class="flex-1 h-3 rounded border overflow-hidden"
          :class="bossPhase2 ? 'bg-purple-950 border-purple-900' : 'bg-red-950 border-red-900'">
          <div class="h-full transition-all duration-100 rounded"
            :style="{
              width: bossHpPct + '%',
              background: bossPhase2
                ? 'linear-gradient(90deg,#7c3aed,#d946ef)'
                : 'linear-gradient(90deg,#ff2200,#ff6600)'
            }" />
        </div>
        <span class="font-orbitron text-[10px]" :class="bossPhase2 ? 'text-purple-400' : 'text-orange-400'">
          {{ Math.ceil(bossHpPct) }}%
        </span>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { bossHpPct, bossPhase2 } from '../game/store.js'
</script>
