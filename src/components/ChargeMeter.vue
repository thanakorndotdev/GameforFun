<template>
  <Transition name="fade">
    <div v-if="chargeLevel > 0 || chargeCooling"
      class="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 pointer-events-none flex flex-col items-center gap-1">
      <span class="font-orbitron text-[9px] tracking-[3px] transition-colors duration-150" :class="chargeLabelClass">
        {{ chargeLabelText }}
      </span>
      <div class="w-44 h-2.5 bg-gray-950 rounded-full border border-gray-800 overflow-hidden">
        <div class="h-full rounded-full transition-none"
          :style="{
            width: (chargeCooling ? (1 - chargeLevel) * 100 : chargeLevel * 100) + '%',
            background: chargeBg
          }" />
      </div>
      <div v-if="chargeLevel >= 0.99 && !chargeCooling"
        class="font-orbitron text-[10px] text-yellow-300 animate-flicker tracking-widest">
        ★ FULL CHARGE ★
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { chargeLevel, chargeCooling, chargeLabelText, chargeLabelClass, chargeBg } from '../game/store.js'
</script>
