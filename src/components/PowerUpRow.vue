<template>
  <Transition name="fade">
    <div v-if="activePU.length > 0"
      class="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 pointer-events-none">
      <TransitionGroup name="pu-list">
        <div v-for="p in activePU" :key="p.id" class="pu-chip">
          <span class="text-base leading-none">{{ p.icon }}</span>
          <div class="w-8 h-1 bg-gray-900 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-none"
              :style="{ width: (p.t / p.max * 100) + '%', background: p.color }" />
          </div>
          <span class="font-orbitron text-[8px]" :style="{ color: p.color }">{{ p.label }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Transition>
</template>

<script setup>
import { activePU } from '../game/store.js'
</script>
