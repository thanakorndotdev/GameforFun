<template>
  <Transition name="fade">
    <div v-if="gstate === 'paused'" class="overlay-base bg-black/70">
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
      <button @click="$emit('resume')"
        class="btn-neon border-neon-green neon-text-green bg-green-950/60 hover:bg-green-900/80 text-sm">
        ▶ เล่นต่อ
      </button>
    </div>
  </Transition>
</template>

<script setup>
import { gstate, score, level } from '../../game/store.js'
defineEmits(['resume'])
</script>
