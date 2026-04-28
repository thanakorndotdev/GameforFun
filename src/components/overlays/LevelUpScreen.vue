<template>
  <Transition name="bounce-in">
    <div v-if="gstate === 'levelup'" class="overlay-base bg-black/80">
      <div class="text-center space-y-2">
        <div class="text-5xl animate-bounce">⭐</div>
        <h2 class="font-orbitron font-black text-4xl neon-text-yellow animate-slide-down">LEVEL CLEAR!</h2>
        <div class="font-orbitron text-sm text-yellow-700">ด่าน {{ level - 1 }} สำเร็จ</div>
      </div>

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

      <div class="w-72 p-3 rounded-xl border bg-gray-950" :class="nextDiffBorderClass">
        <div class="font-orbitron text-[9px] tracking-widest mb-2" :class="nextDiffBadgeTextClass">
          ด่าน {{ level }} — อะไรใหม่?
        </div>
        <ul class="space-y-1">
          <li v-for="hint in nextLevelHints" :key="hint"
            class="font-sarabun text-xs text-gray-400 flex items-start gap-1.5">
            <span class="text-cyan-600 mt-0.5">▸</span> {{ hint }}
          </li>
        </ul>
      </div>

      <button @click="$emit('advance')" class="btn-neon text-sm" :class="nextDiffBtnClass">
        ด่าน {{ level }} ➜
      </button>
    </div>
  </Transition>
</template>

<script setup>
import {
  gstate, score, level, levelBonus,
  nextDiffLabel, nextDiffBadgeTextClass, nextDiffBorderClass, nextDiffBtnClass, nextLevelHints,
} from '../../game/store.js'
defineEmits(['advance'])
</script>
