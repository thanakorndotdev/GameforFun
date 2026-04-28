<template>
  <Transition name="fade">
    <div v-if="gstate === 'start'" class="overlay-base bg-space-900/90">

      <div class="text-center space-y-1">
        <div class="font-orbitron text-xs tracking-[6px] text-cyan-800 animate-pulse-slow">WAVE SHOOTER</div>
        <h1 class="font-orbitron font-black text-5xl leading-tight">
          <span class="neon-text-blue block">SPACE</span>
          <span class="neon-text-orange block">SHOOTER</span>
        </h1>
        <p class="font-sarabun text-cyan-600 text-sm mt-1">กู้กาแล็กซี — ยากขึ้นเรื่อยๆ ทุกด่าน!</p>
      </div>

      <div class="w-72 bg-gray-950 rounded-xl border border-gray-800 overflow-hidden">
        <div class="px-4 py-2 bg-gray-900 border-b border-gray-800">
          <span class="font-orbitron text-[10px] tracking-widest text-gray-500">DIFFICULTY CURVE</span>
        </div>
        <div class="p-3 space-y-2">
          <div v-for="tier in DIFF_TIERS_DISPLAY" :key="tier.levels" class="flex items-center gap-3">
            <div class="difficulty-badge" :class="tier.badge">{{ tier.label }}</div>
            <span class="font-orbitron text-[10px] text-gray-500">ด่าน {{ tier.levels }}</span>
            <div class="flex-1 text-right font-sarabun text-xs text-gray-600">{{ tier.desc }}</div>
          </div>
        </div>
      </div>

      <div class="w-72 bg-blue-950/40 border border-blue-900/50 rounded-xl p-3 space-y-1.5">
        <div class="font-orbitron text-[9px] tracking-widest text-blue-800 mb-2">วิธีเล่น</div>
        <div v-for="ctrl in CONTROLS" :key="ctrl.k" class="flex items-center gap-3 font-sarabun text-sm text-cyan-700">
          <span class="text-base">{{ ctrl.icon }}</span>
          <span class="text-gray-500">{{ ctrl.k }}</span>
          <span>{{ ctrl.desc }}</span>
        </div>
      </div>

      <button @click="$emit('start')" class="btn-neon border-neon-blue neon-text-blue bg-blue-950/60 hover:bg-blue-900/80 text-sm">
        🚀 เริ่มเกม!
      </button>

      <div v-if="highScore > 0" class="font-orbitron text-xs text-yellow-700 flex items-center gap-2">
        🏆 สถิติ: {{ highScore.toLocaleString() }}
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { gstate, highScore } from '../../game/store.js'
import { DIFF_TIERS_DISPLAY, CONTROLS } from '../../game/difficulty.js'
defineEmits(['start'])
</script>
