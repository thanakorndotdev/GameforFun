<template>
  <Transition name="fade">
    <div v-if="gstate === 'bosswarning'" class="overlay-base animate-boss-warn">
      <div class="text-7xl animate-bounce">⚠️</div>
      <h2 class="font-orbitron font-black text-5xl neon-text-orange animate-flicker">BOSS</h2>
      <div class="font-orbitron text-2xl text-orange-700 animate-flicker" style="animation-delay:.2s">INCOMING!</div>
      <div class="font-orbitron text-xs tracking-widest text-orange-900">เตรียมรับมือ...</div>
    </div>
  </Transition>
</template>

<script setup>
import { gstate } from '../../game/store.js'
</script>
