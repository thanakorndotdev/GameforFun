<template>
  <div ref="rootEl" class="relative w-full h-full overflow-hidden select-none bg-black"
    :class="{ 'animate-shake': shakeActive }">

    <canvas ref="canvasRef"
      class="absolute"
      style="image-rendering: pixelated; cursor: none;"
      @mousemove="e => loop.onMouseMove(canvasRef, e)"
      @mousedown.prevent="loop.onMouseDown"
      @mouseup="loop.onMouseUp"
      @mouseleave="loop.onMouseLeave"
      @mouseenter="loop.onMouseEnter"
      @touchmove.prevent="e => loop.onTouchMove(canvasRef, e)"
      @touchstart.prevent="e => loop.onTouchStart(canvasRef, e)"
      @touchend.prevent="loop.onTouchEnd"
    />

    <template v-if="gstate === 'playing' || gstate === 'paused'">
      <HUD />
      <BossBar />
      <PowerUpRow />
      <ChargeMeter />
      <button @click="loop.togglePause()"
        class="absolute top-2.5 right-3 z-20 w-9 h-9 rounded-lg border border-blue-900
               bg-blue-950/70 text-cyan-500 hover:bg-blue-900/80 hover:border-cyan-700 transition-all text-sm">
        ⏸
      </button>
    </template>

    <StartScreen    @start="loop.startGame()" />
    <LevelUpScreen  @advance="loop.advanceLevel()" />
    <BossWarning />
    <GameOverScreen @restart="loop.startGame()" />
    <PauseScreen    @resume="loop.togglePause()" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { gstate, shakeActive } from './game/store.js'
import { useGameLoop } from './game/useGameLoop.js'

import HUD            from './components/HUD.vue'
import BossBar        from './components/BossBar.vue'
import PowerUpRow     from './components/PowerUpRow.vue'
import ChargeMeter    from './components/ChargeMeter.vue'
import StartScreen    from './components/overlays/StartScreen.vue'
import LevelUpScreen  from './components/overlays/LevelUpScreen.vue'
import BossWarning    from './components/overlays/BossWarning.vue'
import GameOverScreen from './components/overlays/GameOverScreen.vue'
import PauseScreen    from './components/overlays/PauseScreen.vue'

const canvasRef = ref(null)
const rootEl    = ref(null)
const loop      = useGameLoop()

onMounted(() => {
  loop.initCanvas(canvasRef.value)
  loop.resizeCanvas(canvasRef.value)
  window.addEventListener('resize', () => loop.resizeCanvas(canvasRef.value))
  window.addEventListener('mouseup', () => loop.onMouseUp())
  window.addEventListener('keydown', e => { if (e.key === 'p' || e.key === 'Escape') loop.togglePause() })
})
onUnmounted(() => loop.destroyLoop())
</script>

<style scoped>
canvas { position: absolute; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.bounce-in-enter-active { animation: bounceIn 0.4s cubic-bezier(.68,-.55,.27,1.55); }
.bounce-in-leave-active { transition: opacity 0.2s ease; }
.bounce-in-leave-to { opacity: 0; }
@keyframes bounceIn { from { transform:scale(0.6); opacity:0; } to { transform:scale(1); opacity:1; } }
.slide-in-enter-active { animation: slideIn 0.3s ease-out; }
.slide-in-leave-active { animation: slideIn 0.2s ease-in reverse; }
@keyframes slideIn { from { transform:translateY(-10px); opacity:0; } to { transform:translateY(0); opacity:1; } }
.combo-pop-enter-active { animation: comboPop 0.25s cubic-bezier(.34,1.56,.64,1); }
.combo-pop-leave-active { transition: opacity 0.2s; }
.combo-pop-leave-to { opacity: 0; }
@keyframes comboPop { from { transform:scale(0.5); opacity:0; } to { transform:scale(1); opacity:1; } }
.pu-list-enter-active { animation: puIn 0.2s ease-out; }
.pu-list-leave-active { transition: opacity 0.3s; }
.pu-list-leave-to { opacity:0; }
@keyframes puIn { from { transform:scale(0.7) translateY(8px); opacity:0; } to { transform:scale(1) translateY(0); opacity:1; } }
</style>
