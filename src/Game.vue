<template>
  <div ref="rootEl" class="relative w-full h-full overflow-hidden select-none bg-black"
    :class="{ 'animate-shake': shakeActive }">

<<<<<<< HEAD
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
=======
    <!-- CANVAS (game rendering) -->
    <canvas ref="canvasRef"
      class="absolute"
      style="image-rendering: pixelated; cursor: none;"
      @mousemove="onMouseMove"
      @mousedown.prevent="onMouseDown"
      @mouseup="onMouseUp"
      @mouseleave="onMouseLeave"
      @mouseenter="onMouseEnter"
      @touchmove.prevent="onTouchMove"
      @touchstart.prevent="onTouchStart"
      @touchend.prevent="onTouchEnd"
    />

    <!-- ═══════════════ HUD ═══════════════ -->
    <div v-if="gstate === 'playing' || gstate === 'paused'"
      class="absolute top-0 left-0 right-0 z-10 flex items-start justify-between px-4 pt-2 pb-6
             bg-gradient-to-b from-black/80 to-transparent pointer-events-none">

      <!-- Score + Combo -->
      <div class="hud-panel">
        <div class="hud-label">SCORE</div>
        <div class="hud-value text-xl tabular-nums">{{ score.toLocaleString() }}</div>
        <Transition name="combo-pop">
          <div v-if="combo > 1" key="combo"
            class="font-orbitron text-xs mt-0.5"
            :class="combo >= 5 ? 'neon-text-pink animate-flicker' : combo >= 3 ? 'neon-text-orange' : 'text-yellow-400'">
            ×{{ combo }} COMBO!
          </div>
        </Transition>
      </div>

      <!-- Difficulty + Level center -->
      <div class="hud-panel">
        <div class="hud-label">LEVEL</div>
        <div class="hud-value">{{ level }}</div>
        <div class="difficulty-badge mt-1" :class="diffBadgeClass">
          {{ diffLabel }}
        </div>
      </div>

      <!-- Lives + Shield -->
      <div class="hud-panel items-end">
        <div class="hud-label">LIVES</div>
        <div class="flex gap-1 mt-0.5">
          <span v-for="i in MAX_LIVES" :key="i"
            class="text-lg transition-all duration-300"
            :class="i <= lives ? 'neon-text-pink' : 'text-gray-800'">♥</span>
        </div>
        <div v-if="shieldHP > 0" class="flex items-center gap-1 mt-1">
          <span class="text-blue-400 text-xs font-orbitron">SHIELD</span>
          <div class="flex gap-0.5">
            <span v-for="s in 3" :key="s" class="text-sm"
              :class="s <= shieldHP ? 'text-blue-400' : 'text-gray-800'">▮</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Difficulty ramp bar (shows during playing) -->
    <div v-if="gstate === 'playing'" class="absolute top-16 left-4 right-4 z-10 pointer-events-none">
      <!-- Wave progress bar -->
      <div class="flex items-center gap-2 mb-1">
        <span class="font-orbitron text-[9px] text-cyan-800 tracking-widest">WAVE</span>
        <div class="flex-1 h-1 bg-gray-900 rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all duration-500"
            :style="{ width: waveProgressPct + '%', background: diffGradient }" />
        </div>
        <span class="font-orbitron text-[9px] text-cyan-800 tracking-widest">{{ waveKilled }}/{{ waveTotal }}</span>
      </div>
    </div>

    <!-- Active Power-ups (bottom) -->
    <div v-if="gstate === 'playing' && activePU.length > 0"
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

    <!-- Charge bar (visible while charging or on cooldown) -->
    <Transition name="fade">
      <div v-if="gstate === 'playing' && (chargeLevel > 0 || chargeCooling)"
        class="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 pointer-events-none flex flex-col items-center gap-1">
        <span class="font-orbitron text-[9px] tracking-[3px] transition-colors duration-150"
          :class="chargeLabelClass">{{ chargeLabelText }}</span>
        <div class="w-44 h-2.5 bg-gray-950 rounded-full border border-gray-800 overflow-hidden">
          <div class="h-full rounded-full transition-none"
            :style="{ width: chargeCooling ? ((1 - chargeLevel) * 100) + '%' : (chargeLevel * 100) + '%',
                      background: chargeBg }" />
        </div>
        <div v-if="chargeLevel >= 0.99 && !chargeCooling"
          class="font-orbitron text-[10px] text-yellow-300 animate-flicker tracking-widest">
          ★ FULL CHARGE ★
        </div>
      </div>
    </Transition>

    <!-- BOSS Health Bar (top, full width) -->
    <Transition name="slide-in">
      <div v-if="gstate === 'playing' && bossHpPct >= 0"
        class="absolute top-[72px] left-4 right-4 z-10 pointer-events-none">
        <div class="flex items-center gap-2">
          <span class="font-orbitron text-[10px] tracking-widest animate-flicker"
            :class="bossPhase2 ? 'text-purple-400' : 'text-orange-500'">BOSS</span>
          <Transition name="fade">
            <span v-if="bossPhase2"
              class="font-orbitron text-[9px] px-1.5 py-0.5 rounded border animate-flicker"
              style="color:#d946ef;border-color:#d946ef55;background:#4a044e33">
              PHASE 2
            </span>
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
          <span class="font-orbitron text-[10px]"
            :class="bossPhase2 ? 'text-purple-400' : 'text-orange-400'">
            {{ Math.ceil(bossHpPct) }}%
          </span>
        </div>
      </div>
    </Transition>

    <!-- ═══════════════ PAUSE BUTTON ═══════════════ -->
    <button v-if="gstate === 'playing'"
      @click="togglePause"
      class="absolute top-2.5 right-3 z-20 w-9 h-9 rounded-lg
             border border-blue-900 bg-blue-950/70 text-cyan-500
             hover:bg-blue-900/80 hover:border-cyan-700 transition-all text-sm">
      ⏸
    </button>

    <!-- ═══════════════ START SCREEN ═══════════════ -->
    <Transition name="fade">
      <div v-if="gstate === 'start'"
        class="overlay-base bg-space-900/90">

        <div class="text-center space-y-1">
          <div class="font-orbitron text-xs tracking-[6px] text-cyan-800 animate-pulse-slow">WAVE SHOOTER</div>
          <h1 class="font-orbitron font-black text-5xl leading-tight">
            <span class="neon-text-blue block">SPACE</span>
            <span class="neon-text-orange block">SHOOTER</span>
          </h1>
          <p class="font-sarabun text-cyan-600 text-sm mt-1">กู้กาแล็กซี — ยากขึ้นเรื่อยๆ ทุกด่าน!</p>
        </div>

        <!-- Difficulty preview -->
        <div class="w-72 bg-gray-950 rounded-xl border border-gray-800 overflow-hidden">
          <div class="px-4 py-2 bg-gray-900 border-b border-gray-800">
            <span class="font-orbitron text-[10px] tracking-widest text-gray-500">DIFFICULTY CURVE</span>
          </div>
          <div class="p-3 space-y-2">
            <div v-for="tier in diffTiers" :key="tier.levels" class="flex items-center gap-3">
              <div class="difficulty-badge" :class="tier.badge">{{ tier.label }}</div>
              <span class="font-orbitron text-[10px] text-gray-500">ด่าน {{ tier.levels }}</span>
              <div class="flex-1 text-right font-sarabun text-xs text-gray-600">{{ tier.desc }}</div>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="w-72 bg-blue-950/40 border border-blue-900/50 rounded-xl p-3 space-y-1.5">
          <div class="font-orbitron text-[9px] tracking-widest text-blue-800 mb-2">วิธีเล่น</div>
          <div v-for="c in controls" :key="c.k"
            class="flex items-center gap-3 font-sarabun text-sm text-cyan-700">
            <span class="text-base">{{ c.icon }}</span>
            <span class="text-gray-500">{{ c.k }}</span>
            <span>{{ c.desc }}</span>
          </div>
        </div>

        <button @click="startGame"
          class="btn-neon border-neon-blue neon-text-blue bg-blue-950/60 hover:bg-blue-900/80 text-sm">
          🚀 เริ่มเกม!
        </button>

        <div v-if="highScore > 0"
          class="font-orbitron text-xs text-yellow-700 flex items-center gap-2">
          🏆 สถิติ: {{ highScore.toLocaleString() }}
        </div>
      </div>
    </Transition>

    <!-- ═══════════════ LEVEL UP ═══════════════ -->
    <Transition name="bounce-in">
      <div v-if="gstate === 'levelup'"
        class="overlay-base bg-black/80">
        <div class="text-center space-y-2">
          <div class="text-5xl animate-bounce">⭐</div>
          <h2 class="font-orbitron font-black text-4xl neon-text-yellow animate-slide-down">
            LEVEL CLEAR!
          </h2>
          <div class="font-orbitron text-sm text-yellow-700">ด่าน {{ level - 1 }} สำเร็จ</div>
        </div>

        <!-- Stats -->
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

        <!-- Next level preview -->
        <div class="w-72 p-3 rounded-xl border bg-gray-950" :class="nextDiffBorderClass">
          <div class="font-orbitron text-[9px] tracking-widest mb-2" :class="nextDiffBadgeTextClass">ด่าน {{ level }} — อะไรใหม่?</div>
          <ul class="space-y-1">
            <li v-for="hint in nextLevelHints" :key="hint"
              class="font-sarabun text-xs text-gray-400 flex items-start gap-1.5">
              <span class="text-cyan-600 mt-0.5">▸</span> {{ hint }}
            </li>
          </ul>
        </div>

        <button @click="advanceLevel"
          class="btn-neon text-sm"
          :class="nextDiffBtnClass">
          ด่าน {{ level }} ➜
        </button>
      </div>
    </Transition>

    <!-- ═══════════════ BOSS WARNING ═══════════════ -->
    <Transition name="fade">
      <div v-if="gstate === 'bosswarning'"
        class="overlay-base animate-boss-warn">
        <div class="text-7xl animate-bounce">⚠️</div>
        <h2 class="font-orbitron font-black text-5xl neon-text-orange animate-flicker">
          BOSS
        </h2>
        <div class="font-orbitron text-2xl text-orange-700 animate-flicker" style="animation-delay:.2s">
          INCOMING!
        </div>
        <div class="font-orbitron text-xs tracking-widest text-orange-900">เตรียมรับมือ...</div>
      </div>
    </Transition>

    <!-- ═══════════════ GAME OVER ═══════════════ -->
    <Transition name="fade">
      <div v-if="gstate === 'gameover'"
        class="overlay-base bg-black/95">
        <h2 class="font-orbitron font-black text-5xl neon-text-pink">GAME OVER</h2>

        <div class="text-center">
          <div class="font-orbitron font-bold text-4xl neon-text-yellow tabular-nums">
            {{ score.toLocaleString() }}
          </div>
          <div class="font-sarabun text-gray-600 text-sm mt-1">ถึงด่านที่ {{ level }}</div>
        </div>

        <Transition name="bounce-in">
          <div v-if="newRecord"
            class="font-orbitron text-sm neon-text-yellow bg-yellow-950/50 border border-yellow-600/50
                   px-5 py-2 rounded-full animate-glow-pulse">
            🏆 สถิติใหม่!
          </div>
        </Transition>

        <!-- ── Run Stats Summary ── -->
        <div class="w-80 bg-gray-950 rounded-2xl border border-gray-800 overflow-hidden">

          <!-- Rating header -->
          <div class="px-5 py-3 flex items-center justify-between border-b border-gray-800"
            :style="{ background: runStats.ratingColor + '18', borderColor: runStats.ratingColor + '44' }">
            <div>
              <div class="font-orbitron text-[9px] tracking-[3px] text-gray-600 mb-0.5">PILOT RATING</div>
              <div class="font-orbitron font-black text-xl tracking-widest"
                :style="{ color: runStats.ratingColor }">{{ runStats.rating }}</div>
            </div>
            <!-- Star rating dots -->
            <div class="flex flex-col items-end gap-1">
              <div class="font-orbitron text-[9px] text-gray-700">THIS RUN</div>
              <div class="flex gap-1.5">
                <div v-for="i in 3" :key="i"
                  class="w-2.5 h-2.5 rounded-full border"
                  :style="{
                    background: i <= Math.ceil((['ROOKIE','PILOT','ACE','VETERAN','ELITE','LEGENDARY'].indexOf(runStats.rating) / 5) * 3) ? runStats.ratingColor : 'transparent',
                    borderColor: runStats.ratingColor + '66'
                  }" />
              </div>
            </div>
          </div>

          <!-- Survival time + score/DPS — big row -->
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
              <span class="font-orbitron text-[8px] text-gray-700">
                Charge {{ runStats.chargeShots }} ครั้ง
              </span>
            </div>
          </div>

          <!-- Grid of small stats -->
          <div class="grid grid-cols-2 divide-x divide-gray-800">
            <div class="p-3 space-y-2.5">
              <div class="flex justify-between items-center">
                <span class="font-orbitron text-[9px] text-gray-600">ศัตรูกำจัด</span>
                <span class="font-orbitron text-xs text-orange-400">{{ sessionKills }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="font-orbitron text-[9px] text-gray-600">Boss kill</span>
                <span class="font-orbitron text-xs" :class="sessionBossKills > 0 ? 'text-red-400' : 'text-gray-700'">
                  {{ sessionBossKills }}
                </span>
              </div>
              <div class="flex justify-between items-center">
                <span class="font-orbitron text-[9px] text-gray-600">PU เก็บได้</span>
                <span class="font-orbitron text-xs text-purple-400">{{ runStats.puCollected }}</span>
              </div>
            </div>
            <div class="p-3 space-y-2.5">
              <div class="flex justify-between items-center">
                <span class="font-orbitron text-[9px] text-gray-600">โดนยิง</span>
                <span class="font-orbitron text-xs"
                  :class="runStats.timesHit === 0 ? 'text-green-400' : runStats.timesHit <= 2 ? 'text-yellow-400' : 'text-red-400'">
                  {{ runStats.timesHit === 0 ? 'NO HIT!' : runStats.timesHit + ' ครั้ง' }}
                </span>
              </div>
              <div class="flex justify-between items-center">
                <span class="font-orbitron text-[9px] text-gray-600">Shield กัน</span>
                <span class="font-orbitron text-xs text-cyan-500">{{ runStats.shieldBlocks }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="font-orbitron text-[9px] text-gray-600">ด่านที่ถึง</span>
                <span class="font-orbitron text-xs text-cyan-400">{{ level }}</span>
              </div>
            </div>
          </div>

          <!-- All-time records footer -->
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

        <button @click="startGame"
          class="btn-neon border-neon-blue neon-text-blue bg-blue-950/60 hover:bg-blue-900/80 text-sm">
          🔄 เล่นใหม่
        </button>
      </div>
    </Transition>

    <!-- ═══════════════ PAUSED ═══════════════ -->
    <Transition name="fade">
      <div v-if="gstate === 'paused'"
        class="overlay-base bg-black/70">
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
        <button @click="togglePause"
          class="btn-neon border-neon-green neon-text-green bg-green-950/60 hover:bg-green-900/80 text-sm">
          ▶ เล่นต่อ
        </button>
      </div>
    </Transition>
>>>>>>> 1ebdd2ccc4dcb0dc520f402adc1eef4433bbfa26
  </div>
</template>

<script setup>
<<<<<<< HEAD
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
=======
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'

// ─── Canvas virtual dimensions ─────────────────────────────────────────────
const VW = 480, VH = 720
const MAX_LIVES = 3

// ─── Difficulty tiers ──────────────────────────────────────────────────────
// Each tier defines how the game feels. Difficulty smoothly ramps within tiers.
const TIERS = [
  { minLevel: 1,  maxLevel: 2,  name: 'EASY',    color: '#00ff88', badge: 'bg-green-950 text-green-400 border border-green-800',  desc: 'เรียนรู้พื้นฐาน' },
  { minLevel: 3,  maxLevel: 4,  name: 'NORMAL',  color: '#00ccff', badge: 'bg-cyan-950 text-cyan-400 border border-cyan-800',     desc: 'เพิ่มศัตรู' },
  { minLevel: 5,  maxLevel: 6,  name: 'HARD',    color: '#ffcc00', badge: 'bg-yellow-950 text-yellow-400 border border-yellow-800', desc: 'UFO ยิงกลับ' },
  { minLevel: 7,  maxLevel: 9,  name: 'EXPERT',  color: '#ff6600', badge: 'bg-orange-950 text-orange-400 border border-orange-800', desc: 'Boss ทุกด่าน!' },
  { minLevel: 10, maxLevel: 99, name: 'INSANE',  color: '#ff4488', badge: 'bg-pink-950 text-pink-400 border border-pink-800',     desc: 'อยู่รอดให้ได้!' },
]

const diffTiers = [
  { levels: '1–2',  label: 'EASY',   badge: 'bg-green-950 text-green-400 border border-green-800',    desc: 'อุกกาบาตช้า' },
  { levels: '3–4',  label: 'NORMAL', badge: 'bg-cyan-950 text-cyan-400 border border-cyan-800',       desc: 'UFO เริ่มมา' },
  { levels: '5–6',  label: 'HARD',   badge: 'bg-yellow-950 text-yellow-400 border border-yellow-800', desc: 'ศัตรูยิงกลับ' },
  { levels: '7–9',  label: 'EXPERT', badge: 'bg-orange-950 text-orange-400 border border-orange-800', desc: 'Boss ทุกด่าน' },
  { levels: '10+',  label: 'INSANE', badge: 'bg-pink-950 text-pink-400 border border-pink-800',       desc: 'ไม่มีที่สิ้นสุด' },
]

const controls = [
  { icon: '🖱️', k: 'เมาส์',  desc: 'เคลื่อนที่เรือ' },
  { icon: '👆', k: 'แตะ',    desc: 'บนมือถือ' },
  { icon: '⏸', k: 'P / Esc', desc: 'หยุดชั่วคราว' },
]

function getTier(lv) { return TIERS.find(t => lv >= t.minLevel && lv <= t.maxLevel) || TIERS[TIERS.length - 1] }

// ─── Difficulty params (computed from level) ───────────────────────────────
function getDiffParams(lv) {
  const t = getTier(lv)
  const within = lv - t.minLevel  // 0-based within tier
  const base = {
    enemySpeed:    1.2 + lv * 0.18,
    spawnInterval: Math.max(500, 2500 - lv * 140),
    waveSize:      5 + lv * 2,
    asteroidBig:   0.2 + Math.min(lv * 0.03, 0.2),
    ufoChance:     lv >= 3 ? Math.min(0.1 + (lv - 3) * 0.06, 0.45) : 0,
    dartChance:    lv >= 2 ? Math.min(0.1 + (lv - 2) * 0.04, 0.35) : 0,
    kamikazeChance:lv >= 5 ? Math.min(0.05 + (lv - 5) * 0.04, 0.3) : 0,
    formationChance:lv >= 3 ? Math.min(0.08 + (lv - 3) * 0.04, 0.35) : 0,
    ufoShootRate:  Math.max(400, 2000 - lv * 110),
    enemyBulletSpd:4.5 + lv * 0.4,
    bossEveryN:    lv >= 7 ? 1 : 3,   // every N levels
    bossHp:        18 + lv * 6,
    puDropRate:    Math.max(0.12, 0.28 - lv * 0.01),
    pointMult:     1 + Math.floor((lv - 1) / 2) * 0.5,
  }
  return base
}

function getNextLevelHints(lv) {
  const hints = []
  const p = getDiffParams(lv)
  const prev = getDiffParams(lv - 1)
  if (lv === 3) hints.push('UFO เริ่มปรากฏ — เคลื่อนที่แบบซิกแซก')
  if (lv === 3) hints.push('Formation enemies — บินเป็นกลุ่ม V, Grid, Diamond!')
  if (lv === 5) hints.push('ศัตรูยิงลูกหลงกลับ!')
  if (lv === 7) hints.push('⚠️ Boss ทุกด่านตั้งแต่นี้ไป!')
  if (lv === 10) hints.push('🔥 โหมด INSANE — ทุกอย่างเร็วและแน่นขึ้น')
  if (lv >= 5 && p.kamikazeChance > prev.kamikazeChance) hints.push('Kamikaze dart — พุ่งตรงมาหาเรือ!')
  hints.push(`ความเร็วศัตรู +${((p.enemySpeed - prev.enemySpeed) * 100).toFixed(0)}%`)
  hints.push(`จำนวนศัตรูต่อด่าน: ${p.waveSize} ตัว`)
  if (hints.length < 2) hints.push('คะแนนต่อตัวสูงขึ้น!')
  return hints.slice(0, 3)
}

// ─── Vue state ────────────────────────────────────────────────────────────
const canvasRef = ref(null)
const rootEl = ref(null)
const gstate = ref('start')
const score = ref(0)
const lives = ref(MAX_LIVES)
const level = ref(1)
const combo = ref(1)
const shieldHP = ref(0)
const levelBonus = ref(0)
const newRecord = ref(false)
const highScore = ref(Number(localStorage.getItem('ss2_hs') || 0))
const bestLevel = ref(Number(localStorage.getItem('ss2_bl') || 1))
const totalKills = ref(Number(localStorage.getItem('ss2_tk') || 0))
const bossKills = ref(Number(localStorage.getItem('ss2_bk') || 0))
const activePU = reactive([])
const bossHpPct = ref(-1)
const waveKilled = ref(0)
const waveTotal = ref(0)
const shakeActive = ref(false)
const bossPhase2 = ref(false)   // drives HUD badge + bar color
const chargeLevel = ref(0)
const chargeCooling = ref(false)

// Computed run stats — populated by calcRunStats() at death
const runStats = reactive({
  survivalSec: 0,
  accuracy: 0,
  dps: 0,
  maxCombo: 1,
  bulletsTotal: 0,
  chargeShots: 0,
  timesHit: 0,
  shieldBlocks: 0,
  puCollected: 0,
  rating: '',
  ratingColor: '',
})

const chargeLabelText = computed(() => {
  if (chargeCooling.value) return 'COOLDOWN'
  if (chargeLevel.value >= 0.99) return '★ RELEASE!'
  if (chargeLevel.value >= 0.7)  return 'CHARGED'
  if (chargeLevel.value >= 0.3)  return 'CHARGING...'
  return 'CHARGING...'
})
const chargeLabelClass = computed(() => {
  if (chargeCooling.value)        return 'text-gray-600'
  if (chargeLevel.value >= 0.99)  return 'text-yellow-300 animate-flicker'
  if (chargeLevel.value >= 0.7)   return 'text-yellow-500'
  if (chargeLevel.value >= 0.3)   return 'text-purple-400'
  return 'text-purple-700'
})
const chargeBg = computed(() => {
  if (chargeCooling.value)        return '#374151'
  if (chargeLevel.value >= 0.99)  return 'linear-gradient(90deg,#facc15,#fff,#facc15)'
  if (chargeLevel.value >= 0.7)   return 'linear-gradient(90deg,#f59e0b,#fde68a)'
  return 'linear-gradient(90deg,#7c3aed,#a855f7)'
})

const diffBadgeClass = computed(() => getTier(level.value).badge)
const diffLabel = computed(() => getTier(level.value).name)
const diffGradient = computed(() => getTier(level.value).color)
const nextDiffLabel = computed(() => getTier(level.value).name)
const nextDiffBadgeTextClass = computed(() => {
  const t = getTier(level.value)
  return t.badge.split(' ').find(c => c.startsWith('text-')) || 'text-cyan-400'
})
const nextDiffBorderClass = computed(() => {
  const t = getTier(level.value)
  return t.badge.split(' ').find(c => c.startsWith('border-')) || 'border-cyan-800'
})
const nextDiffBtnClass = computed(() => {
  const m = { EASY: 'border-green-500 text-green-400 bg-green-950/60 hover:bg-green-900/80',
              NORMAL: 'border-cyan-500 text-cyan-400 bg-cyan-950/60 hover:bg-cyan-900/80',
              HARD: 'border-yellow-500 text-yellow-400 bg-yellow-950/60 hover:bg-yellow-900/80',
              EXPERT: 'border-orange-500 text-orange-400 bg-orange-950/60 hover:bg-orange-900/80',
              INSANE: 'border-pink-500 text-pink-400 bg-pink-950/60 hover:bg-pink-900/80' }
  return m[getTier(level.value).name] || m.NORMAL
})
const nextLevelHints = computed(() => getNextLevelHints(level.value))
const waveProgressPct = computed(() => waveTotal.value > 0 ? (waveKilled.value / waveTotal.value * 100) : 0)

// ─── Canvas / game engine ──────────────────────────────────────────────────
let ctx = null
let raf = null
let lastTime = 0

let player = null
let bullets = []
let enemies = []
let particles = []
let powerups = []
let floats = []
let bossRef = null

// Parallax system
let px = null   // holds the full parallax state

let shootTimer = 0
let spawnTimer = 0
let dp = {}  // difficulty params
let bossActive = false
let mouse = { x: VW / 2, y: VH / 2, visible: false }

// Charge shot state
const CHARGE_MAX   = 1200  // ms to reach full charge
const CHARGE_CD    = 1600  // ms cooldown after firing
let charge = { active: false, t: 0, cooldown: 0 }
let puIdCtr = 0
let sessionKills = 0
let sessionBossKills = 0
let multiShot = false
let speedBoost = false
let comboTimer = 0
let shake = 0
let screenFlash = { alpha: 0, color: '#ffffff' }  // canvas flash overlay

// Run stat trackers (reset each game)
let runStartTime   = 0
let runBulletsFired = 0
let runChargeShots  = 0
let runTimesHit     = 0
let runShieldBlocks = 0
let runPUCollected  = 0
let runMaxCombo     = 1
let runChargeUsed   = 0   // total charge shots actually fired (ratio ≥ 0.15)

// ─── Parallax system ─────────────────────────────────────────────────────
// Layer config — back (index 0) → front (index 4)
const LAYER_CFG = [
  { count: 55, speed: 0.22, size: 0.45, alpha: 0.28, drift: 0.004, twinkle: false }, // dust
  { count: 42, speed: 0.55, size: 0.85, alpha: 0.48, drift: 0.012, twinkle: true  }, // far stars
  { count: 26, speed: 1.1,  size: 1.45, alpha: 0.70, drift: 0.028, twinkle: true  }, // mid stars
  { count: 12, speed: 2.1,  size: 2.4,  alpha: 0.90, drift: 0.055, twinkle: true  }, // near stars
  { count: 5,  speed: 3.4,  size: 3.8,  alpha: 1.00, drift: 0.095, twinkle: false }, // close bright
]

// Nebula palette — 6 large blobs with distinct space hues
const NEBULA_COLS = ['#2244aa','#441166','#113355','#331144','#114433','#221133']

function initParallax() {
  const layers = LAYER_CFG.map(cfg => {
    const stars = []
    for (let i = 0; i < cfg.count; i++) {
      stars.push({
        x:  Math.random() * VW,
        y:  Math.random() * VH,
        t:  Math.random() * Math.PI * 2,   // twinkle phase
        // cross-glint phase (only used for front layers)
        gt: Math.random() * Math.PI * 2,
      })
    }
    return { ...cfg, stars, xOff: 0 }
  })

  const nebulae = []
  for (let i = 0; i < 6; i++) {
    nebulae.push({
      x:   Math.random() * VW,
      y:   Math.random() * VH,
      r:   160 + Math.random() * 180,
      vx:  (Math.random() - 0.5) * 0.06,
      vy:  0.04 + Math.random() * 0.06,
      col: NEBULA_COLS[i],
      a:   0.025 + Math.random() * 0.03,
      xOff: 0,   // horizontal drift offset
    })
  }

  px = {
    layers,
    nebulae,
    shootingStars: [],
    shootTimer: 180 + Math.random() * 300,
  }
}

// ─── Parallax update (called from main update) ──────────────────────────
function updateParallax(dt) {
  const targetX = player ? (player.x - VW / 2) : 0

  // Nebulae — slow drift + horizontal parallax
  for (const n of px.nebulae) {
    n.xOff += (targetX * 0.003 - n.xOff) * 0.02
    n.x += n.vx + n.xOff * 0.001
    n.y += n.vy
    if (n.x < -n.r * 1.5)  n.x = VW + n.r
    if (n.x > VW + n.r * 1.5) n.x = -n.r
    if (n.y > VH + n.r)    { n.y = -n.r; n.x = Math.random() * VW }
  }

  // Star layers — scroll + horizontal drift
  for (const layer of px.layers) {
    layer.xOff += (targetX * layer.drift - layer.xOff) * 0.06

    for (const s of layer.stars) {
      s.y += layer.speed
      s.t += 0.025
      s.gt += 0.018
      if (s.y > VH + 4) {
        s.y = -4
        s.x = Math.random() * VW
      }
    }
  }

  // Shooting stars
  px.shootTimer -= dt
  if (px.shootTimer <= 0) {
    px.shootTimer = 220 + Math.random() * 480
    const fromLeft = Math.random() < 0.5
    const angle    = (Math.PI * 0.18) + Math.random() * (Math.PI * 0.14)
    const spd      = 9 + Math.random() * 7
    px.shootingStars.push({
      x:    fromLeft ? -20 : VW + 20,
      y:    20 + Math.random() * VH * 0.55,
      vx:   (fromLeft ? 1 : -1) * Math.cos(angle) * spd,
      vy:   Math.sin(angle) * spd,
      life: 55 + Math.random() * 35,
      maxLife: 90,
      len:  40 + Math.random() * 50,
    })
  }
  for (const ss of px.shootingStars) {
    ss.x += ss.vx; ss.y += ss.vy; ss.life--
  }
  px.shootingStars = px.shootingStars.filter(ss => ss.life > 0)
}

// ─── drawParallax — full layered background ──────────────────────────────
function drawParallax(c) {
  // ── Nebula blobs ────────────────────────────────────────────────────────
  const tierCol = getTier(level.value).color
  for (const n of px.nebulae) {
    // Blend between nebula's own colour and current tier accent subtly
    c.globalAlpha = n.a
    const grad = c.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r)
    grad.addColorStop(0,   n.col)
    grad.addColorStop(0.5, n.col + '66')
    grad.addColorStop(1,   'transparent')
    c.fillStyle = grad
    c.fillRect(0, 0, VW, VH)
  }
  // Tier-accent nebula — shifts with difficulty
  c.globalAlpha = 0.032
  const tg = c.createRadialGradient(VW * 0.65, VH * 0.3, 0, VW * 0.65, VH * 0.3, VW * 0.55)
  tg.addColorStop(0, tierCol); tg.addColorStop(1, 'transparent')
  c.fillStyle = tg; c.fillRect(0, 0, VW, VH)
  c.globalAlpha = 1

  // ── Star layers (dust → far → mid → near → bright) ───────────────────
  for (let li = 0; li < px.layers.length; li++) {
    const layer  = px.layers[li]
    const isFront = li >= 3     // near / bright layers get extra effects
    const xOff   = layer.xOff

    for (const s of layer.stars) {
      const sx = ((s.x + xOff) % VW + VW) % VW
      const twinkleA = layer.twinkle
        ? layer.alpha * (0.45 + 0.55 * Math.sin(s.t))
        : layer.alpha

      c.globalAlpha = twinkleA
      c.fillStyle   = '#ffffff'
      c.beginPath()
      c.arc(sx, s.y, layer.size, 0, Math.PI * 2)
      c.fill()

      // Cross-glint for the 2 brightest front layers
      if (isFront && li === 4) {
        const glintA = 0.35 * Math.pow(Math.max(0, Math.sin(s.gt)), 6)
        if (glintA > 0.01) {
          c.globalAlpha = glintA
          const gl = layer.size * 3.5
          c.strokeStyle = '#ffffff'
          c.lineWidth   = 0.8
          c.beginPath()
          c.moveTo(sx - gl, s.y); c.lineTo(sx + gl, s.y)
          c.moveTo(sx, s.y - gl); c.lineTo(sx, s.y + gl)
          c.stroke()
        }
      }
    }
  }
  c.globalAlpha = 1

  // ── Shooting stars ───────────────────────────────────────────────────
  for (const ss of px.shootingStars) {
    const t = ss.life / ss.maxLife          // 1→0 as it dies
    const headA = Math.min(1, t * 3)        // fades in then out
    const tailA = t * 0.5

    // Tail gradient
    c.save()
    c.translate(ss.x, ss.y)
    c.rotate(Math.atan2(ss.vy, ss.vx))
    const sg = c.createLinearGradient(-ss.len, 0, 0, 0)
    sg.addColorStop(0,   `rgba(255,255,255,0)`)
    sg.addColorStop(0.6, `rgba(200,230,255,${tailA * 0.4})`)
    sg.addColorStop(1,   `rgba(255,255,255,${tailA})`)
    c.strokeStyle = sg
    c.lineWidth   = 1.5
    c.beginPath(); c.moveTo(-ss.len, 0); c.lineTo(0, 0); c.stroke()
    // Bright head dot
    c.globalAlpha = headA
    c.fillStyle   = '#ffffff'
    c.beginPath(); c.arc(0, 0, 1.5, 0, Math.PI * 2); c.fill()
    c.restore()
  }
  c.globalAlpha = 1
}

// ─── Player ───────────────────────────────────────────────────────────────
function resetPlayer() {
  player = { x: VW / 2, y: VH - 90, w: 38, h: 48, tx: VW / 2, inv: 0 }
  shieldHP.value = 0
  multiShot = false
  speedBoost = false
}

// ─── Enemy factories ──────────────────────────────────────────────────────
function spawnAsteroid() {
  const big = Math.random() < dp.asteroidBig
  const r = big ? 32 + Math.random() * 10 : 14 + Math.random() * 10
  const sides = 7 + Math.floor(Math.random() * 5)
  const verts = []
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2
    verts.push({ x: Math.cos(a) * r * (0.65 + Math.random() * 0.35), y: Math.sin(a) * r * (0.65 + Math.random() * 0.35) })
  }
  enemies.push({
    type: 'asteroid', x: r + Math.random() * (VW - r * 2), y: -r - 10,
    vx: (Math.random() - 0.5) * 2.5, vy: dp.enemySpeed * (big ? 0.7 : 1),
    r, verts, angle: Math.random() * Math.PI * 2, rotSpd: (Math.random() - 0.5) * 0.05,
    hp: big ? 3 : 1, maxHp: big ? 3 : 1, pts: big ? 30 : 10, dead: false,
  })
}

function spawnUFO() {
  const left = Math.random() < 0.5
  const hp = 2 + Math.floor(level.value / 2)
  enemies.push({
    type: 'ufo',
    x: left ? -45 : VW + 45, y: 80 + Math.random() * 240,
    vx: (left ? 1 : -1) * dp.enemySpeed * 0.85,
    vy: 0.4, sineT: 0, sineAmp: 22 + Math.random() * 20,
    w: 54, h: 28, hp, maxHp: hp, pts: 50, shootTimer: 60 + Math.random() * 60, dead: false,
  })
}

function spawnDart(kamikaze = false) {
  const tx = player ? player.x : VW / 2
  const ty = player ? player.y : VH / 2
  const sx = 30 + Math.random() * (VW - 60)
  const sy = -30
  const spd = dp.enemySpeed * (kamikaze ? 1.8 : 1.2)
  const dx = tx - sx, dy = ty - sy
  const d = Math.sqrt(dx * dx + dy * dy)
  enemies.push({
    type: 'dart',
    x: sx, y: sy,
    vx: kamikaze ? dx / d * spd : (Math.random() - 0.5) * 3,
    vy: kamikaze ? dy / d * spd : spd,
    w: 18, h: 32, hp: 1, maxHp: 1, pts: kamikaze ? 40 : 25,
    kamikaze, angle: kamikaze ? Math.atan2(dy, dx) - Math.PI / 2 : 0,
    dead: false,
  })
}

// ─── Formation enemies ────────────────────────────────────────────────────
// Each formation = one leader + N followers sharing a formationId.
// Followers track their slot offset relative to the leader each frame.
// When the leader dies, all followers break and dive toward the player.

let formationIdCtr = 0

const FORMATION_SHAPES = {
  // Each entry: array of [col, row] slot offsets (leader = [0,0])
  V: [
    [0,0],
    [-1,1],[ 1,1],
    [-2,2],[ 2,2],
  ],
  arrow: [
    [0,0],
    [-1,1],[ 1,1],
    [-2,2],[ 2,2],
    [0,2],
  ],
  grid: [
    [-1,0],[0,0],[1,0],
    [-1,1],[0,1],[1,1],
  ],
  diamond: [
    [0,0],
    [-1,1],[1,1],
    [0,2],
  ],
  pincer: [
    [-2,0],[-1,0],[1,0],[2,0],
    [0,1],
  ],
}

function spawnFormation() {
  const names  = Object.keys(FORMATION_SHAPES)
  // Weight heavier formations at higher levels
  const pool = level.value >= 6
    ? [...names, 'arrow', 'pincer']
    : level.value >= 4
    ? [...names, 'V', 'grid']
    : ['V', 'grid', 'diamond']
  const shape = pool[Math.floor(Math.random() * pool.length)]
  const slots = FORMATION_SHAPES[shape]

  const fid  = ++formationIdCtr
  const spd  = dp.enemySpeed * 0.75
  const slot_gap = 38   // px between slots
  const startX = slot_gap * 1.5 + Math.random() * (VW - slot_gap * 3)
  const startY = -50

  // Tint colour per shape
  const tints = { V:'#ff8844', arrow:'#ff4488', grid:'#44ffaa', diamond:'#44aaff', pincer:'#ffcc00' }
  const tint  = tints[shape] || '#ff8844'

  // Pts scale with size
  const pts = 20 + slots.length * 8

  // Shared leader ref — first slot is leader
  let leaderRef = null

  slots.forEach(([col, row], idx) => {
    const isLeader = idx === 0
    const member = {
      type: 'formation',
      x: startX + col * slot_gap,
      y: startY - row * slot_gap,
      vx: 0, vy: spd,
      w: 18, h: 28,
      hp: 1, maxHp: 1,
      pts,
      fid,           // formation ID
      shape,
      tint,
      col, row,      // slot offsets
      slotGap: slot_gap,
      isLeader,
      leader: null,  // set after push
      diving: false, // true = broke from formation, kamikaze dive
      angle: 0,
      t: 0,          // wobble timer
      dead: false,
    }
    if (isLeader) {
      enemies.push(member)
      leaderRef = member
    } else {
      member.leader = leaderRef
      enemies.push(member)
    }
  })

  // Count all members against wave
  waveLeft = Math.max(0, waveLeft - (slots.length - 1))
}

// Called when a formation member is killed — survivors dive
function breakFormation(deadMember) {
  if (!player) return
  enemies.forEach(e => {
    if (e.type !== 'formation' || e.fid !== deadMember.fid || e.dead) return
    e.diving = true
    e.leader = null
    // Aim toward player with slight spread
    const dx = player.x - e.x + (Math.random() - 0.5) * 60
    const dy = player.y - e.y
    const d  = Math.sqrt(dx * dx + dy * dy) + 0.001
    const spd = dp.enemySpeed * 1.5
    e.vx = dx / d * spd
    e.vy = dy / d * spd
    e.angle = Math.atan2(e.vy, e.vx) - Math.PI / 2
  })
}

function spawnBoss() {
  const hp = dp.bossHp
  const b = {
    type: 'boss', x: VW / 2, y: -120, targetY: 105,
    vx: 1.1 + level.value * 0.03, vy: 1.2,
    w: 140, h: 100, hp, maxHp: hp,
    pts: 800 + level.value * 100,
    t: 0, phase: 0, shootTimer: 50, dead: false,
    // Phase-2 fields
    p2: false,           // has phase 2 triggered
    p2rage: false,       // rage at 25% HP
    p2teleTimer: 0,      // countdown to next teleport
    p2ringTimer: 0,      // circular ring shot timer
    p2riftTimer: 0,      // edge-rift bullet timer
    p2orbitAngle: 0,     // rotating orbit ring angle
    p2flashAlpha: 0,     // white flash on teleport
  }
  enemies.push(b)
  bossRef = b
  bossActive = true
  bossPhase2.value = false
  bossHpPct.value = 100
}

function fireBullet(x, y, vx, vy, owner, color, w = 4, h = 16) {
  if (owner === 'player') runBulletsFired++
  bullets.push({ x, y, vx, vy, owner, color, w, h, dead: false })
}

// ─── Phase 2 ──────────────────────────────────────────────────────────────
function fireRing(x, y, n, speed, color, w = 5, h = 14) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    fireBullet(x, y, Math.cos(a) * speed, Math.sin(a) * speed, 'enemy', color, w, h)
  }
}

function fireRift(bossX, bossY) {
  // Bullets materialise from left + right screen edges, aimed at player
  if (!player) return
  for (const side of [-1, 1]) {
    const sx = side === -1 ? 0 : VW
    const sy = 80 + Math.random() * (VH - 200)
    const dx = player.x - sx, dy = player.y - sy
    const d  = Math.sqrt(dx * dx + dy * dy) + 0.001
    const spd = dp.enemyBulletSpd * 1.1
    fireBullet(sx, sy, dx / d * spd, dy / d * spd, 'enemy', '#cc44ff', 6, 14)
    // Small burst at spawn point
    burst(sx, sy, '#cc44ff', 6, 3)
  }
}

function triggerPhase2(e) {
  e.p2 = true
  bossPhase2.value = true

  // Speed up
  e.vx = (e.vx > 0 ? 1 : -1) * (Math.abs(e.vx) * 1.3)

  // Screen flash purple
  screenFlash.color = '#8800cc'
  screenFlash.alpha = 0.55
  triggerShake(20)

  // Wipe all enemy bullets — fresh start
  bullets = bullets.filter(b => b.owner !== 'enemy')

  // Drop a power-up gift
  const def = [{ type:'shield', icon:'🛡️', color:'#00aaff', label:'SHIELD' },
               { type:'life',   icon:'❤️', color:'#ff4488', label:'LIFE'   }]
  const gift = def[Math.floor(Math.random() * def.length)]
  powerups.push({ ...gift, x: e.x, y: e.y + 60, vy: 1.2, angle: 0, w: 26, h: 26, dead: false })

  // Big burst + float
  burst(e.x, e.y, '#cc44ff', 40, 6, true)
  burst(e.x, e.y, '#ffffff', 16, 3)
  addFloat(e.x, e.y - 70, '⚠ PHASE 2 ⚠', '#dd44ff')

  // Seed timers — longer gaps so player has time to breathe
  e.p2ringTimer  = 800
  e.p2riftTimer  = 2500
  e.p2teleTimer  = 5000
  e.shootTimer   = 1000
}

// ─── Charge shot ──────────────────────────────────────────────────────────
function chargeShot() {
  if (!player) { resetCharge(); return }
  const ratio = charge.t / CHARGE_MAX       // 0 → 1

  // Below 15% — cancel silently, no shot
  if (ratio < 0.15) { resetCharge(); return }

  runChargeUsed++

  // Bullet stats scale with charge ratio
  const r       = 6  + ratio * 22           // radius 6–28
  const dmg     = Math.max(2, Math.round(ratio * 12))  // 2–12 dmg
  const pierceN = ratio >= 0.99 ? 999       // full = infinite pierce
                : ratio >= 0.7  ? 6
                : ratio >= 0.3  ? 2
                : 1
  const spd     = 14 + ratio * 6            // 14–20
  const color   = ratio >= 0.99 ? '#ffffa0'
                : ratio >= 0.7  ? '#ffcc00'
                : '#cc88ff'
  const glow    = ratio >= 0.99 ? '#ffff44'
                : ratio >= 0.7  ? '#ff9900'
                : '#9933ff'

  bullets.push({
    x: player.x,
    y: player.y - player.h / 2 - r - 4,
    vx: 0, vy: -spd,
    owner: 'player', color, glow,
    w: r * 2, h: r * 2,
    r, dmg, pierceLeft: pierceN,
    charged: true,
    hitSet: new Set(),   // enemies already struck this pass
    dead: false,
  })

  // Muzzle burst
  burst(player.x, player.y - player.h / 2, color, 18 + Math.round(ratio * 14), 5 + ratio * 3, true)
  triggerShake(ratio >= 0.99 ? 9 : ratio >= 0.7 ? 5 : 2)

  if (ratio >= 0.99) addFloat(player.x, player.y - 60, 'MAX POWER!!', '#ffff44')
  else if (ratio >= 0.7) addFloat(player.x, player.y - 50, 'CHARGED!', '#ffcc00')

  // Reset and enter cooldown
  charge.t = 0
  charge.active = false
  charge.cooldown = CHARGE_CD
  chargeLevel.value = 0
  chargeCooling.value = true
  shootTimer = 350   // brief gap before auto-fire resumes
}

function resetCharge() {
  charge.active = false; charge.t = 0
  chargeLevel.value = 0; chargeCooling.value = false
}

function burst(x, y, color, n = 14, spd = 4, big = false) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2
    const s = spd * (0.4 + Math.random() * 0.8)
    particles.push({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      color, size: big ? 3 + Math.random() * 4 : 1.5 + Math.random() * 3,
      life: 45 + Math.random() * 30, maxLife: 75, dead: false,
    })
  }
}

function addFloat(x, y, text, color = '#ffff88') {
  floats.push({ x, y, text, color, life: 55, maxLife: 55, vy: -1.2, dead: false })
}

// ─── Power-ups ─────────────────────────────────────────────────────────────
const PU_DEFS = [
  { type: 'multi',  icon: '🔫', color: '#ff9900', label: 'MULTI' },
  { type: 'shield', icon: '🛡️', color: '#00aaff', label: 'SHIELD' },
  { type: 'speed',  icon: '⚡', color: '#ffff00', label: 'SPEED' },
  { type: 'life',   icon: '❤️', color: '#ff4488', label: 'LIFE' },
  { type: 'bomb',   icon: '💣', color: '#ff6600', label: 'BOMB' },
]
const PU_DUR = 8000

function maybeDropPU(x, y) {
  if (Math.random() > dp.puDropRate) return
  // At higher levels drop more useful PUs
  let pool = [...PU_DEFS]
  if (level.value >= 5) pool = [...pool, PU_DEFS[0], PU_DEFS[1]]  // weight multi+shield
  const def = pool[Math.floor(Math.random() * pool.length)]
  powerups.push({ ...def, x, y, vy: 1.6, angle: 0, w: 26, h: 26, dead: false })
}

function applyPU(type) {
  runPUCollected++
  if (type === 'life') {
    if (lives.value < MAX_LIVES) lives.value++
    addFloat(player.x, player.y - 40, '+LIFE ❤️', '#ff4488')
    return
  }
  if (type === 'bomb') {
    // Screen-clear bomb
    const cleared = enemies.filter(e => e.type !== 'boss').length
    for (const e of enemies) {
      if (e.type !== 'boss') {
        e.dead = true
        burst(e.x, e.y, '#ff6600', 8)
      } else {
        e.hp -= 8
      }
    }
    waveKilled.value = Math.min(waveKilled.value + cleared, waveTotal.value)
    score.value += cleared * 15 * combo.value
    addFloat(player.x, player.y - 50, `BOOM! ×${cleared}`, '#ff6600')
    triggerShake(16)
    return
  }
  const idx = activePU.findIndex(p => p.type === type)
  if (idx !== -1) activePU.splice(idx, 1)
  const id = ++puIdCtr
  const def = PU_DEFS.find(p => p.type === type)
  activePU.push({ id, type, icon: def.icon, color: def.color, label: def.label, t: PU_DUR, max: PU_DUR })
  if (type === 'multi') multiShot = true
  if (type === 'shield') shieldHP.value = 3
  if (type === 'speed') speedBoost = true
}

function tickPU(dt) {
  for (let i = activePU.length - 1; i >= 0; i--) {
    activePU[i].t -= dt
    if (activePU[i].t <= 0) {
      const t = activePU[i].type
      activePU.splice(i, 1)
      if (t === 'multi') multiShot = false
      if (t === 'speed') speedBoost = false
    }
  }
}

// ─── Shake ────────────────────────────────────────────────────────────────
function triggerShake(amt) {
  shake = amt
  shakeActive.value = true
  setTimeout(() => { shakeActive.value = false }, 200)
}

// ─── Spawn wave ──────────────────────────────────────────────────────────
let spawnInterval = 2000
let waveLeft = 0
let waveSize = 0

function startWave() {
  dp = getDiffParams(level.value)
  bossActive = false
  bossRef = null
  bossHpPct.value = -1
  const isBoss = level.value % dp.bossEveryN === 0
  if (isBoss) {
    gstate.value = 'bosswarning'
    setTimeout(() => {
      if (gstate.value === 'bosswarning') {
        gstate.value = 'playing'
        spawnBoss()
        waveSize = 1; waveLeft = 1
        waveTotal.value = 1; waveKilled.value = 0
      }
    }, 2400)
  } else {
    waveSize = dp.waveSize
    waveLeft = waveSize
    waveTotal.value = waveSize
    waveKilled.value = 0
    spawnInterval = dp.spawnInterval
    spawnTimer = 0
  }
}

function spawnNext() {
  if (waveLeft <= 0 || bossActive) return
  // Choose type based on chances
  const r = Math.random()
  const kam = dp.kamikazeChance
  const dart = dp.dartChance
  const ufo = dp.ufoChance
  const form = dp.formationChance
  if (r < form) { spawnFormation(); waveLeft-- }
  else if (r < form + kam) spawnDart(true)
  else if (r < form + kam + dart) spawnDart(false)
  else if (r < form + kam + dart + ufo) spawnUFO()
  else spawnAsteroid()
  waveLeft--
}

// ─── Collisions ───────────────────────────────────────────────────────────
function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return Math.abs(ax - bx) < (aw + bw) / 2 && Math.abs(ay - by) < (ah + bh) / 2
}
function circleRect(cx, cy, cr, rx, ry, rw, rh) {
  const dx = Math.abs(cx - rx), dy = Math.abs(cy - ry)
  if (dx > rw / 2 + cr || dy > rh / 2 + cr) return false
  if (dx <= rw / 2 || dy <= rh / 2) return true
  return (dx - rw / 2) ** 2 + (dy - rh / 2) ** 2 <= cr * cr
}

// ─── Update ───────────────────────────────────────────────────────────────
function update(dt) {
  shake = Math.max(0, shake - 1)
  if (screenFlash.alpha > 0) screenFlash.alpha = Math.max(0, screenFlash.alpha - 0.035)

  // Parallax background update
  updateParallax(dt)

  // Player move (smooth)
  if (player) {
    player.x += (player.tx - player.x) * 0.14
    player.x = Math.max(player.w / 2, Math.min(VW - player.w / 2, player.x))
    if (player.inv > 0) player.inv -= dt
  }

  // Combo decay
  if (comboTimer > 0) { comboTimer -= dt; if (comboTimer <= 0) combo.value = 1 }

  // Charge tick
  if (charge.active && player) {
    charge.t = Math.min(charge.t + dt, CHARGE_MAX)
    chargeLevel.value = charge.t / CHARGE_MAX
  }
  if (charge.cooldown > 0) {
    charge.cooldown -= dt
    chargeLevel.value = charge.cooldown / CHARGE_CD  // bar drains during cooldown
    if (charge.cooldown <= 0) {
      charge.cooldown = 0
      chargeLevel.value = 0
      chargeCooling.value = false
    }
  }

  // Auto fire — suppressed while charging or on cooldown
  const fireRate = multiShot ? 160 : 240
  shootTimer -= dt
  if (shootTimer <= 0 && player && !charge.active && charge.cooldown <= 0) {
    shootTimer = fireRate
    const cx = player.x, ty2 = player.y - player.h / 2 - 8
    if (multiShot) {
      fireBullet(cx - 13, ty2, -0.6, -14, 'player', '#00ffff')
      fireBullet(cx,      ty2,  0,   -15, 'player', '#ffffff')
      fireBullet(cx + 13, ty2,  0.6, -14, 'player', '#00ffff')
    } else {
      fireBullet(cx, ty2, 0, -15, 'player', '#00ccff')
    }
  }

  // Spawn
  if (!bossActive && waveLeft > 0) {
    spawnTimer -= dt
    if (spawnTimer <= 0) { spawnTimer = spawnInterval; spawnNext() }
  }

  // Bullets
  for (const b of bullets) {
    b.x += b.vx; b.y += b.vy
    // Spawn energy trail behind charged bullets
    if (b.charged) {
      particles.push({
        x: b.x + (Math.random() - 0.5) * b.r * 1.2,
        y: b.y + b.r * 0.8,
        vx: (Math.random() - 0.5) * 1.2,
        vy: 1.5 + Math.random() * 2,
        color: b.color,
        size: 1.5 + Math.random() * (b.r * 0.25),
        life: 12 + Math.random() * 12, maxLife: 24, dead: false,
      })
    }
    if (b.y < -60 || b.y > VH + 30 || b.x < -30 || b.x > VW + 30) b.dead = true
  }

  // Enemies update
  for (const e of enemies) {
    if (e.type === 'asteroid') {
      e.x += e.vx; e.y += e.vy; e.angle += e.rotSpd
      if (e.y > VH + 70) e.dead = true
    } else if (e.type === 'ufo') {
      e.sineT += 0.04
      e.x += e.vx + Math.sin(e.sineT) * e.sineAmp * 0.04
      e.y += e.vy
      if (e.x < -90 || e.x > VW + 90 || e.y > VH + 50) e.dead = true
      if (player && level.value >= 3) {
        e.shootTimer -= dt
        if (e.shootTimer <= 0) {
          e.shootTimer = dp.ufoShootRate
          const dx = player.x - e.x, dy = player.y - e.y
          const d = Math.sqrt(dx * dx + dy * dy)
          fireBullet(e.x, e.y + e.h / 2, dx / d * dp.enemyBulletSpd, dy / d * dp.enemyBulletSpd, 'enemy', '#ff4444', 5, 12)
        }
      }
    } else if (e.type === 'dart') {
      if (e.kamikaze && player) {
        // Home toward player slightly
        const dx = player.x - e.x, dy = player.y - e.y
        const d = Math.sqrt(dx * dx + dy * dy) + 0.001
        e.vx += dx / d * 0.2; e.vy += dy / d * 0.2
        const spd = Math.sqrt(e.vx * e.vx + e.vy * e.vy)
        if (spd > dp.enemySpeed * 2.2) { e.vx *= dp.enemySpeed * 2.2 / spd; e.vy *= dp.enemySpeed * 2.2 / spd }
        e.angle = Math.atan2(e.vy, e.vx) - Math.PI / 2
      }
      e.x += e.vx; e.y += e.vy
      if (e.y > VH + 50 || e.x < -50 || e.x > VW + 50) e.dead = true

    } else if (e.type === 'formation') {
      e.t += dt
      if (e.diving) {
        // Broke from formation — dive toward player
        if (player) {
          const dx = player.x - e.x, dy = player.y - e.y
          const d  = Math.sqrt(dx * dx + dy * dy) + 0.001
          e.vx += dx / d * 0.25; e.vy += dy / d * 0.25
          const spd = Math.sqrt(e.vx * e.vx + e.vy * e.vy)
          const max = dp.enemySpeed * 2.4
          if (spd > max) { e.vx *= max / spd; e.vy *= max / spd }
          e.angle = Math.atan2(e.vy, e.vx) - Math.PI / 2
        }
        e.x += e.vx; e.y += e.vy
        if (e.y > VH + 60 || e.x < -60 || e.x > VW + 60) e.dead = true
      } else if (e.leader && !e.leader.dead) {
        // Track slot position relative to live leader
        const targetX = e.leader.x + e.col * e.slotGap
        const targetY = e.leader.y + e.row * e.slotGap
        // Smooth follow with slight wobble for organic feel
        const wobble = Math.sin(e.t * 0.003 + e.col) * 2
        e.x += (targetX + wobble - e.x) * 0.18
        e.y += (targetY - e.y) * 0.18
      } else if (!e.isLeader && !e.diving) {
        // Leader just died — break immediately
        e.diving = true
        if (player) {
          const dx = player.x - e.x + (Math.random() - 0.5) * 50
          const dy = player.y - e.y
          const d  = Math.sqrt(dx * dx + dy * dy) + 0.001
          const spd = dp.enemySpeed * 1.5
          e.vx = dx / d * spd; e.vy = dy / d * spd
          e.angle = Math.atan2(e.vy, e.vx) - Math.PI / 2
        }
      } else if (e.isLeader) {
        // Leader moves straight down with gentle sine drift
        e.x += Math.sin(e.t * 0.0015) * 1.2
        e.y += dp.enemySpeed * 0.75
        e.x  = Math.max(e.w / 2, Math.min(VW - e.w / 2, e.x))
        if (e.y > VH + 60) e.dead = true
      }
    } else if (e.type === 'boss') {
      e.t += dt

      if (e.phase === 0) {
        // Enter from top
        e.y += Math.min(e.vy, Math.max(0.3, (e.targetY - e.y) * 0.06))
        if (e.y >= e.targetY) { e.phase = 1 }

      } else {
        // ── Phase 2 trigger at 50% HP ───────────────────────────────────
        if (!e.p2 && e.hp <= e.maxHp * 0.5) triggerPhase2(e)

        // ── Rage at 25% HP ──────────────────────────────────────────────
        if (e.p2 && !e.p2rage && e.hp <= e.maxHp * 0.25) {
          e.p2rage = true
          e.vx *= 1.2
          screenFlash.color = '#ff0044'; screenFlash.alpha = 0.4
          addFloat(e.x, e.y - 80, '★ RAGE ★', '#ff4488')
          triggerShake(14)
        }

        // ── Orbit angle (visual) ─────────────────────────────────────────
        if (e.p2) e.p2orbitAngle += dt * (e.p2rage ? 0.006 : 0.004)

        // ── Horizontal movement ──────────────────────────────────────────
        e.x += e.vx
        if (e.x > VW - e.w / 2 - 8) e.vx = -Math.abs(e.vx)
        if (e.x < e.w / 2 + 8)      e.vx =  Math.abs(e.vx)

        // ── Phase 1 aimed shots ──────────────────────────────────────────
        if (!e.p2) {
          e.shootTimer -= dt
          if (e.shootTimer <= 0) {
            e.shootTimer = Math.max(900, 3000 - level.value * 80)
            const pattern = level.value >= 7 ? 'spread5' : 'spread3'
            if (pattern === 'spread5') {
              for (let i = -2; i <= 2; i++)
                fireBullet(e.x + i * 22, e.y + e.h / 2,
                  i * 0.9 + (player ? (player.x - e.x) / VH * 1.5 : 0),
                  dp.enemyBulletSpd, 'enemy', '#ff6600', 6, 14)
            } else {
              for (let i = -1; i <= 1; i++)
                fireBullet(e.x + i * 30, e.y + e.h / 2,
                  i * 1.2 + (player ? (player.x - e.x) / VH * 1.5 : 0),
                  dp.enemyBulletSpd, 'enemy', '#ff6600', 6, 14)
            }
          }
        }

        // ── Phase 2 attack patterns ──────────────────────────────────────
        if (e.p2) {
          const rage = e.p2rage
          const spd  = dp.enemyBulletSpd * (rage ? 1.35 : 1.1)

          // Aimed triple burst
          e.shootTimer -= dt
          if (e.shootTimer <= 0) {
            e.shootTimer = rage ? 800 : 1200
            if (player) {
              const dx = player.x - e.x, dy = player.y - e.y
              const d  = Math.sqrt(dx * dx + dy * dy) + 0.001
              const spread = 0.20
              for (const off of [-spread, 0, spread]) {
                const a = Math.atan2(dy, dx) + off
                fireBullet(e.x, e.y + e.h / 2,
                  Math.cos(a) * spd, Math.sin(a) * spd,
                  'enemy', '#ff44aa', 5, 12)
              }
              if (rage) fireBullet(e.x, e.y, 0, -spd * 0.7, 'enemy', '#ff44aa', 5, 12)
            }
          }

          // Ring shot — fewer bullets, slower
          e.p2ringTimer -= dt
          if (e.p2ringTimer <= 0) {
            e.p2ringTimer = rage ? 1800 : 2600
            const n = rage ? 8 : 6
            fireRing(e.x, e.y, n, spd * 0.7, '#cc44ff')
          }

          // Rift bullets — fewer, slower
          e.p2riftTimer -= dt
          if (e.p2riftTimer <= 0) {
            e.p2riftTimer = rage ? 2400 : 3500
            const count = rage ? 2 : 1
            for (let i = 0; i < count; i++) {
              setTimeout(() => { if (e && !e.dead) fireRift(e.x, e.y) }, i * 400)
            }
          }

          // Teleport — less frequent
          e.p2teleTimer -= dt
          if (e.p2teleTimer <= 0) {
            e.p2teleTimer = rage ? 3500 : 6000
            // Flash white on departure
            e.p2flashAlpha = 1.0
            screenFlash.color = '#aa00ff'; screenFlash.alpha = 0.25
            const newX = e.w / 2 + 30 + Math.random() * (VW - e.w - 60)
            setTimeout(() => {
              if (e && !e.dead) {
                e.x = newX
                e.p2flashAlpha = 1.0
                burst(e.x, e.y, '#cc44ff', 18, 4)
                triggerShake(6)
              }
            }, 180)
          }
          // Fade out teleport flash
          if (e.p2flashAlpha > 0) e.p2flashAlpha = Math.max(0, e.p2flashAlpha - dt * 0.004)
        }
      }
      bossHpPct.value = e.hp / e.maxHp * 100
    }
  }

  // Powerup drift
  for (const p of powerups) { p.y += p.vy; p.angle += 0.06; if (p.y > VH + 40) p.dead = true }

  // Active PU timers
  tickPU(dt)

  // Particles
  for (const p of particles) {
    p.x += p.vx; p.y += p.vy; p.vy += 0.07; p.vx *= 0.97; p.life--
    if (p.life <= 0) p.dead = true
  }

  // Floats
  for (const f of floats) { f.y += f.vy; f.life--; if (f.life <= 0) f.dead = true }

  // ── Player bullets vs enemies ──────────────────────────────────────────
  for (const b of bullets) {
    if (b.dead || b.owner !== 'player') continue
    for (const e of enemies) {
      if (e.dead) continue
      if (b.hitSet && b.hitSet.has(e)) continue   // pierce: skip already-hit enemies

      const hitR  = b.charged ? b.r : 3
      const hit   = e.type === 'asteroid'
        ? circleRect(b.x, b.y, hitR, e.x, e.y, e.r * 2, e.r * 2)
        : rectOverlap(b.x, b.y, b.w, b.h, e.x, e.y, e.w, e.h)
      if (!hit) continue

      const dmg = b.dmg || 1
      const sparkColor = b.charged ? b.color : '#aaffff'
      // Spark on impact
      for (let s = 0; s < (b.charged ? 6 : 1); s++) {
        particles.push({ x: b.x + (Math.random()-.5)*hitR, y: b.y + (Math.random()-.5)*hitR,
          vx: (Math.random()-.5)*4, vy: (Math.random()-.5)*4,
          color: sparkColor, size: b.charged ? 3 : 2, life: 14, maxLife: 14, dead: false })
      }

      e.hp -= dmg

      if (b.charged) {
        // Pierce: track this enemy, count down remaining targets
        b.hitSet.add(e)
        b.pierceLeft--
        if (b.pierceLeft <= 0) b.dead = true
      } else {
        b.dead = true
      }

      // ── Kill reward (same for pierce and normal) ─────────────────────
      if (e.hp <= 0) {
        e.dead = true
        const pts = Math.round(e.pts * combo.value * dp.pointMult * (b.charged ? 1.5 : 1))
        score.value += pts
        combo.value = Math.min(10, combo.value + 1)
        comboTimer = 3500
        if (combo.value > runMaxCombo) runMaxCombo = combo.value
        sessionKills++
        waveKilled.value = Math.min(waveKilled.value + 1, waveTotal.value)
        addFloat(e.x, e.y, `+${pts}`, combo.value > 3 ? '#ff9900' : '#ffff88')
        const ec = { boss:'#ff4400', ufo:'#44ff88', dart:'#ff4444', asteroid:'#ffaa44', formation: e.tint || '#ff8844' }[e.type] || '#ffaa44'
        burst(e.x, e.y, ec, e.type === 'boss' ? 35 : 14, 4, e.type === 'boss')
        burst(e.x, e.y, '#ffffff', 6, 2)
        if (e.type === 'boss') {
          sessionBossKills++
          bossActive = false; bossRef = null; bossHpPct.value = -1
          for (let i = 0; i < 3; i++) {
            const def = PU_DEFS[i % 4]
            setTimeout(() => {
              if (player) powerups.push({ ...def, x: e.x + (i - 1) * 45, y: e.y + 20, vy: 1.5, angle: 0, w: 26, h: 26, dead: false })
            }, i * 180)
          }
        } else if (e.type === 'formation') {
          breakFormation(e)
          maybeDropPU(e.x, e.y)
        } else {
          maybeDropPU(e.x, e.y)
        }
      }

      if (!b.charged) break   // normal bullets stop at first hit
    }
  }

  // ── Enemy hits player ──────────────────────────────────────────────────
  if (player && player.inv <= 0) {
    for (const b of bullets) {
      if (b.dead || b.owner !== 'enemy') continue
      if (rectOverlap(b.x, b.y, b.w, b.h, player.x, player.y, player.w * 0.85, player.h * 0.85)) {
        b.dead = true; hitPlayer(); break
      }
    }
    for (const e of enemies) {
      if (e.dead) continue
      const hit = e.type === 'asteroid'
        ? circleRect(player.x, player.y, player.w / 2 * 0.8, e.x, e.y, e.r * 2, e.r * 2)
        : rectOverlap(player.x, player.y, player.w * 0.8, player.h * 0.8, e.x, e.y, e.w * 0.8, e.h * 0.8)
      if (hit) {
        hitPlayer(); e.hp -= 2
        if (e.hp <= 0) {
          e.dead = true; burst(e.x, e.y, '#ffaa44', 10)
          waveKilled.value = Math.min(waveKilled.value + 1, waveTotal.value)
          if (e.type === 'boss') { bossActive = false; bossRef = null; bossHpPct.value = -1 }
        }
        break
      }
    }
  }

  // ── Powerup pickup ─────────────────────────────────────────────────────
  if (player) {
    for (const p of powerups) {
      if (p.dead) continue
      if (rectOverlap(p.x, p.y, p.w, p.h, player.x, player.y, player.w, player.h)) {
        p.dead = true; applyPU(p.type)
        burst(p.x, p.y, p.color, 10, 3); addFloat(p.x, p.y - 20, p.label, p.color)
      }
    }
  }

  // Cleanup
  bullets   = bullets.filter(b => !b.dead)
  enemies   = enemies.filter(e => !e.dead)
  particles = particles.filter(p => !p.dead)
  powerups  = powerups.filter(p => !p.dead)
  floats    = floats.filter(f => !f.dead)

  // ── Wave complete? ─────────────────────────────────────────────────────
  if (gstate.value === 'playing' && enemies.length === 0 && waveLeft === 0 && !bossActive) {
    const bonus = level.value * 150
    levelBonus.value = bonus; score.value += bonus
    level.value++
    gstate.value = 'levelup'
  }
}

// ─── Hit player ───────────────────────────────────────────────────────────
function hitPlayer() {
  if (!player || player.inv > 0) return
  if (shieldHP.value > 0) {
    shieldHP.value--
    runShieldBlocks++
    burst(player.x, player.y, '#00aaff', 12)
    addFloat(player.x, player.y - 30, 'SHIELD BLOCK!', '#00aaff')
    player.inv = 500; triggerShake(5)
    if (shieldHP.value === 0) {
      const i = activePU.findIndex(p => p.type === 'shield')
      if (i !== -1) activePU.splice(i, 1)
    }
    return
  }
  runTimesHit++
  lives.value--; combo.value = 1
  burst(player.x, player.y, '#ff4488', 20); triggerShake(14)
  if (lives.value <= 0) {
    burst(player.x, player.y, '#ffaa44', 28)
    player = null
    // Compute run stats before wiping state
    calcRunStats()
    // Save persistent stats
    if (score.value > highScore.value) {
      highScore.value = score.value
      localStorage.setItem('ss2_hs', score.value)
      newRecord.value = true
    }
    const bl = Math.max(level.value, Number(localStorage.getItem('ss2_bl') || 1))
    bestLevel.value = bl; localStorage.setItem('ss2_bl', bl)
    totalKills.value += sessionKills; localStorage.setItem('ss2_tk', totalKills.value)
    bossKills.value += sessionBossKills; localStorage.setItem('ss2_bk', bossKills.value)
    setTimeout(() => { gstate.value = 'gameover' }, 800)
  } else {
    player.inv = 2200
    addFloat(player.x, player.y - 40, `${lives.value} LIVES LEFT`, '#ff4488')
  }
}

// ─── Run stats calculation ────────────────────────────────────────────────
function calcRunStats() {
  const elapsed   = (Date.now() - runStartTime) / 1000           // seconds
  const totalShots = runBulletsFired + runChargeUsed             // all player shots
  const accuracy  = totalShots > 0
    ? Math.round((sessionKills / totalShots) * 100)
    : 0
  const dps = elapsed > 0 ? Math.round(score.value / elapsed) : 0

  // Rating based on accuracy + combo + hits taken
  let stars = 0
  if (accuracy >= 60)  stars++
  if (accuracy >= 85)  stars++
  if (runMaxCombo >= 5) stars++
  if (runMaxCombo >= 8) stars++
  if (runTimesHit === 0) stars += 2
  else if (runTimesHit <= 1) stars++
  if (sessionBossKills > 0) stars++

  const ratings = [
    { min: 0,  label: 'ROOKIE',    color: '#888880' },
    { min: 2,  label: 'PILOT',     color: '#5DCAA5' },
    { min: 4,  label: 'ACE',       color: '#00ccff' },
    { min: 5,  label: 'VETERAN',   color: '#ffcc00' },
    { min: 6,  label: 'ELITE',     color: '#ff9900' },
    { min: 7,  label: 'LEGENDARY', color: '#ff4488' },
  ]
  const r = [...ratings].reverse().find(r => stars >= r.min) || ratings[0]

  // Write into reactive runStats
  runStats.survivalSec  = Math.round(elapsed)
  runStats.accuracy     = accuracy
  runStats.dps          = dps
  runStats.maxCombo     = runMaxCombo
  runStats.bulletsTotal = totalShots
  runStats.chargeShots  = runChargeUsed
  runStats.timesHit     = runTimesHit
  runStats.shieldBlocks = runShieldBlocks
  runStats.puCollected  = runPUCollected
  runStats.rating       = r.label
  runStats.ratingColor  = r.color
}
function draw() {
  if (!ctx) return
  const c = ctx
  c.save()
  if (shake > 0.5) c.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake)

  // BG solid base
  c.fillStyle = '#000814'; c.fillRect(0, 0, VW, VH)

  // Full parallax — nebulae, 5 star layers, shooting stars
  drawParallax(c)

  // Particles
  for (const p of particles) {
    c.globalAlpha = p.life / p.maxLife
    c.fillStyle = p.color
    c.beginPath(); c.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2); c.fill()
  }
  c.globalAlpha = 1

  // Power-ups
  for (const p of powerups) {
    c.save(); c.translate(p.x, p.y); c.rotate(p.angle)
    c.shadowColor = p.color; c.shadowBlur = 14
    c.fillStyle = p.color + '22'; c.strokeStyle = p.color; c.lineWidth = 1.5
    c.beginPath()
    for (let i = 0; i < 6; i++) {
      const a2 = (i / 6) * Math.PI * 2
      i === 0 ? c.moveTo(Math.cos(a2) * 13, Math.sin(a2) * 13) : c.lineTo(Math.cos(a2) * 13, Math.sin(a2) * 13)
    }
    c.closePath(); c.fill(); c.stroke()
    c.shadowBlur = 0
    c.font = '14px Sarabun'; c.textAlign = 'center'; c.textBaseline = 'middle'
    c.fillText(p.icon, 0, 1)
    c.restore()
  }

  // ── Enemies ─────────────────────────────────────────────────────────────
  for (const e of enemies) {
    c.save(); c.translate(e.x, e.y)
    if (e.type === 'asteroid') {
      c.rotate(e.angle)
      c.shadowColor = '#aa6633'; c.shadowBlur = 8
      c.fillStyle = e.hp > 1 ? '#6a4f2e' : '#8a6040'
      c.strokeStyle = '#c49a6c'; c.lineWidth = 1.5
      c.beginPath()
      e.verts.forEach((v, i) => i === 0 ? c.moveTo(v.x, v.y) : c.lineTo(v.x, v.y))
      c.closePath(); c.fill(); c.stroke()
      c.shadowBlur = 0
      // Cracks for big asteroids
      if (e.maxHp > 1) {
        c.strokeStyle = '#c49a6c55'; c.lineWidth = 0.8
        c.beginPath(); c.moveTo(-e.r * 0.3, -e.r * 0.2); c.lineTo(e.r * 0.2, e.r * 0.3); c.stroke()
        c.beginPath(); c.moveTo(e.r * 0.1, -e.r * 0.4); c.lineTo(-e.r * 0.2, e.r * 0.1); c.stroke()
      }
    } else if (e.type === 'ufo') {
      c.shadowColor = '#44ff88'; c.shadowBlur = 16
      c.fillStyle = '#1a3a1a'; c.strokeStyle = '#44ff88'; c.lineWidth = 1.5
      c.beginPath(); c.ellipse(0, 4, e.w / 2, e.h / 2 * 0.55, 0, 0, Math.PI * 2); c.fill(); c.stroke()
      c.fillStyle = '#2a4a2a'; c.strokeStyle = '#66ff66'; c.lineWidth = 1
      c.beginPath(); c.ellipse(0, -2, e.w * 0.28, e.h * 0.5, 0, Math.PI, 0); c.fill(); c.stroke()
      c.shadowBlur = 0
      const lc = ['#ff4444','#ffff44','#44ff44','#44ffff','#ff44ff']
      for (let i = 0; i < 5; i++) {
        const a2 = (i / 5) * Math.PI * 2 + e.sineT
        c.fillStyle = lc[i]; c.beginPath()
        c.arc(Math.cos(a2) * e.w * 0.38, 4 + Math.sin(a2) * e.h * 0.15, 2.5, 0, Math.PI * 2); c.fill()
      }
      if (e.hp < e.maxHp) {
        const bw = e.w * 0.85
        c.fillStyle = '#440000'; c.fillRect(-bw/2, -e.h/2 - 10, bw, 4)
        c.fillStyle = '#44ff44'; c.fillRect(-bw/2, -e.h/2 - 10, bw * e.hp / e.maxHp, 4)
      }
    } else if (e.type === 'dart') {
      c.rotate(e.angle)
      c.shadowColor = e.kamikaze ? '#ff00ff' : '#ff4444'; c.shadowBlur = 14
      c.fillStyle = e.kamikaze ? '#440044' : '#aa1111'
      c.strokeStyle = e.kamikaze ? '#ff44ff' : '#ff6666'; c.lineWidth = 1.5
      c.beginPath()
      c.moveTo(0, e.h / 2); c.lineTo(-e.w / 2, -e.h / 2)
      c.lineTo(0, -e.h / 2 * 0.5); c.lineTo(e.w / 2, -e.h / 2)
      c.closePath(); c.fill(); c.stroke()
      // Exhaust
      c.shadowBlur = 0
      c.fillStyle = (e.kamikaze ? '#ff00ff' : '#ff6600') + '99'
      c.beginPath()
      c.moveTo(-5, e.h / 2); c.lineTo(5, e.h / 2); c.lineTo(0, e.h / 2 + 10 + Math.random() * 6); c.closePath(); c.fill()
    } else if (e.type === 'boss') {
      const w = e.w, h = e.h
      const pulse = 0.5 + 0.5 * Math.sin(e.t * 0.003)
      const p2    = e.p2
      const rage  = e.p2rage

      // ── Phase 2 purple vignette ─────────────────────────────────────────
      if (p2) {
        const vigA = rage
          ? 0.08 + 0.04 * Math.sin(e.t * 0.005)
          : 0.04 + 0.02 * Math.sin(e.t * 0.003)
        c.globalAlpha = vigA
        const vig = c.createRadialGradient(VW / 2, 0, VH * 0.3, VW / 2, 0, VH * 1.1)
        vig.addColorStop(0, 'transparent')
        vig.addColorStop(1, rage ? '#ff0066' : '#6600cc')
        c.fillStyle = vig; c.fillRect(0, 0, VW, VH)
        c.globalAlpha = 1
      }

      // ── Hull ────────────────────────────────────────────────────────────
      const hullFill   = p2 ? (rage ? '#250020' : '#1a0030') : '#2a0008'
      const hullStroke = p2 ? (rage ? '#ff44aa' : '#cc44ff') : '#ff3300'
      c.shadowColor = hullStroke
      c.shadowBlur  = 22 + pulse * 16
      c.fillStyle   = hullFill
      c.strokeStyle = hullStroke
      c.lineWidth   = 2
      c.beginPath()
      c.moveTo(0, -h / 2); c.lineTo(w / 2, -h * 0.1)
      c.lineTo(w * 0.42, h / 2); c.lineTo(-w * 0.42, h / 2)
      c.lineTo(-w / 2, -h * 0.1); c.closePath(); c.fill(); c.stroke()

      // ── Core ────────────────────────────────────────────────────────────
      if (p2) {
        // Phase 2 — pulsing purple/pink core, outer glow ring
        const coreR = 22 + pulse * 8
        c.shadowColor = rage ? '#ff0066' : '#aa00ff'
        c.shadowBlur  = 36
        c.fillStyle   = `rgba(${rage ? '255,0,100' : '180,0,255'},${0.75 + pulse * 0.25})`
        c.beginPath(); c.arc(0, 0, coreR, 0, Math.PI * 2); c.fill()
        // Inner white hot spot
        c.fillStyle = `rgba(255,255,255,${0.5 + pulse * 0.4})`
        c.beginPath(); c.arc(0, 0, coreR * 0.38, 0, Math.PI * 2); c.fill()
        // Pulsing outer ring
        c.globalAlpha = 0.35 + pulse * 0.3
        c.strokeStyle = rage ? '#ff44aa' : '#dd44ff'
        c.lineWidth   = 2
        c.shadowBlur  = 18
        c.beginPath(); c.arc(0, 0, coreR * 1.6, 0, Math.PI * 2); c.stroke()
        c.globalAlpha = 1
      } else {
        c.shadowColor = '#ff0000'; c.shadowBlur = 32
        c.fillStyle   = `rgba(255,${60 + pulse * 80},0,${0.8 + pulse * 0.2})`
        c.beginPath(); c.arc(0, 0, 20 + pulse * 7, 0, Math.PI * 2); c.fill()
      }

      // ── Orbiting energy rings (Phase 2 only) ────────────────────────────
      if (p2) {
        const rings = rage ? 3 : 2
        for (let ri = 0; ri < rings; ri++) {
          const rAngle = e.p2orbitAngle + (ri / rings) * Math.PI * 2
          const rR     = 52 + ri * 18
          const rAlpha = 0.35 + 0.2 * Math.sin(e.t * 0.004 + ri)
          c.globalAlpha = rAlpha
          c.strokeStyle = rage ? '#ff44aa' : '#aa44ff'
          c.lineWidth   = 1.5
          c.shadowColor = rage ? '#ff0066' : '#8800cc'
          c.shadowBlur  = 10
          c.save()
          c.rotate(rAngle)
          c.setLineDash([6, 8])
          c.beginPath(); c.arc(0, 0, rR, 0, Math.PI * 2); c.stroke()
          c.setLineDash([])
          // Energy node on ring
          c.globalAlpha = rAlpha + 0.3
          c.fillStyle   = rage ? '#ff88cc' : '#cc88ff'
          c.beginPath(); c.arc(rR, 0, 3.5, 0, Math.PI * 2); c.fill()
          c.restore()
          c.globalAlpha = 1
        }
      }

      // ── Wing lines ──────────────────────────────────────────────────────
      c.shadowBlur  = 8
      c.strokeStyle = p2 ? (rage ? '#ff66bb' : '#aa66ff') : '#ff6600'
      c.lineWidth   = 1.5
      for (const sign of [-1, 1]) {
        c.beginPath()
        c.moveTo(sign * 22, -12); c.lineTo(sign * w * 0.42, 0)
        c.lineTo(sign * w * 0.36, h * 0.3); c.stroke()
      }

      // ── Cannon ports — colour by phase ──────────────────────────────────
      c.shadowBlur  = 0
      c.fillStyle   = p2 ? (rage ? '#ff0066' : '#aa00ff') : '#ff4400'
      for (let i = -2; i <= 2; i++) {
        c.beginPath(); c.arc(i * 24, h / 2 - 8, 4.5, 0, Math.PI * 2); c.fill()
      }

      // ── Teleport flash overlay ───────────────────────────────────────────
      if (e.p2flashAlpha > 0) {
        c.globalAlpha = e.p2flashAlpha * 0.7
        c.fillStyle   = rage ? '#ff44aa' : '#dd88ff'
        c.beginPath()
        c.arc(0, 0, Math.max(w, h) * 0.9, 0, Math.PI * 2)
        c.fill()
        c.globalAlpha = 1
      }

      // ── Phase label ─────────────────────────────────────────────────────
      c.shadowBlur = 0
      c.font = 'bold 10px Orbitron, monospace'; c.textAlign = 'center'
      if (e.phase === 0) {
        c.fillStyle = '#ff660066'
        c.fillText('ENTERING...', 0, -h / 2 - 14)
      } else if (rage) {
        c.fillStyle = `rgba(255,68,136,${0.6 + 0.4 * Math.sin(e.t * 0.01)})`
        c.fillText('RAGE', 0, -h / 2 - 14)
      } else if (p2) {
        c.fillStyle = `rgba(180,80,255,${0.5 + 0.3 * Math.sin(e.t * 0.006)})`
        c.fillText('PHASE 2', 0, -h / 2 - 14)
      }
      } else if (e.type === 'formation') {
      c.rotate(e.angle)
      const tint   = e.tint || '#ff8844'
      const isDiving = e.diving
      const isLdr  = e.isLeader

      // Glow stronger for leader, dimmer for followers
      c.shadowColor = tint
      c.shadowBlur  = isLdr ? 16 : 10
      c.fillStyle   = isDiving ? (tint + 'cc') : (isLdr ? tint.replace('ff','88') + '44' : '#1a0010')
      c.strokeStyle = tint
      c.lineWidth   = isLdr ? 2 : 1.5

      // Ship silhouette — slightly narrower than dart
      const w2 = e.w, h2 = e.h
      c.beginPath()
      c.moveTo(0, -h2 / 2)
      c.lineTo(-w2 / 2, h2 * 0.25)
      c.lineTo(-w2 * 0.22, h2 / 2)
      c.lineTo( w2 * 0.22, h2 / 2)
      c.lineTo( w2 / 2, h2 * 0.25)
      c.closePath()
      c.fill(); c.stroke()

      // Nose tip accent
      c.shadowBlur = 6
      c.fillStyle  = isDiving ? '#ffffff' : tint
      c.beginPath(); c.arc(0, -h2 / 2, 2.5, 0, Math.PI * 2); c.fill()

      // Engine exhaust (points down since ship faces up)
      c.shadowBlur = 0
      c.fillStyle  = tint + '88'
      const fl = 6 + Math.random() * (isDiving ? 8 : 5)
      c.beginPath()
      c.moveTo(-4, h2 / 2); c.lineTo(4, h2 / 2)
      c.lineTo(0, h2 / 2 + fl); c.closePath(); c.fill()

      // Leader crown indicator — small dot above leader
      if (isLdr && !isDiving) {
        c.shadowColor = tint; c.shadowBlur = 8
        c.fillStyle = '#ffffff'
        c.beginPath(); c.arc(0, -h2 / 2 - 8, 2, 0, Math.PI * 2); c.fill()
      }
    }
    c.restore()
  }
  for (const b of bullets) {
    c.save()
    if (b.charged) {
      const pulse = 0.65 + 0.35 * Math.sin(Date.now() * 0.018)
      c.shadowColor = b.glow || b.color
      c.shadowBlur  = 30 + pulse * 24
      // Outer soft halo
      c.globalAlpha = 0.25
      c.fillStyle = b.color
      c.beginPath(); c.arc(b.x, b.y, b.r * 1.8, 0, Math.PI * 2); c.fill()
      // Mid layer
      c.globalAlpha = 0.55
      c.beginPath(); c.arc(b.x, b.y, b.r, 0, Math.PI * 2); c.fill()
      // Bright core
      c.globalAlpha = 1
      c.fillStyle = '#ffffff'
      c.beginPath(); c.arc(b.x, b.y, b.r * 0.4, 0, Math.PI * 2); c.fill()
      // Spinning ring
      c.globalAlpha = 0.7
      c.strokeStyle = b.color
      c.lineWidth = 1.5
      c.shadowBlur = 8
      c.save()
      c.translate(b.x, b.y)
      c.rotate(Date.now() * 0.006)
      c.setLineDash([4, 5])
      c.beginPath(); c.arc(0, 0, b.r * 1.3, 0, Math.PI * 2); c.stroke()
      c.setLineDash([])
      c.restore()
      c.globalAlpha = 1
    } else if (b.owner === 'player') {
      c.shadowColor = '#00ccff'; c.shadowBlur = 12
      c.fillStyle = '#aaffff'
      c.beginPath()
      if (c.roundRect) c.roundRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 2)
      else c.rect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h)
      c.fill()
      c.fillStyle = '#ffffff'
      c.fillRect(b.x - b.w / 2 + 1, b.y - b.h / 2, b.w - 2, 5)
    } else {
      c.shadowColor = b.color; c.shadowBlur = 10
      c.fillStyle = b.color
      c.beginPath(); c.arc(b.x, b.y, b.w / 2 + 1, 0, Math.PI * 2); c.fill()
    }
    c.restore()
  }

  // ── Player ship ─────────────────────────────────────────────────────────
  if (player) {
    const vis = player.inv <= 0 || Math.floor(player.inv / 80) % 2 === 0
    if (vis) {
      c.save(); c.translate(player.x, player.y)
      const w = player.w, h = player.h
      // Engine glow
      c.shadowColor = '#0066ff'; c.shadowBlur = 18
      c.fillStyle = '#0044ff44'
      c.beginPath(); c.ellipse(0, h / 2 + 6, 10, 4, 0, 0, Math.PI * 2); c.fill()
      // Flame
      const fl = 12 + Math.random() * 9
      c.fillStyle = '#0055ff'
      c.beginPath(); c.moveTo(-8, h/2-2); c.lineTo(8, h/2-2); c.lineTo(0, h/2+fl); c.closePath(); c.fill()
      c.fillStyle = '#44aaff'
      c.beginPath(); c.moveTo(-4, h/2-2); c.lineTo(4, h/2-2); c.lineTo(0, h/2+fl*0.55); c.closePath(); c.fill()
      // Hull
      c.shadowColor = '#00aaff'; c.shadowBlur = 10
      c.fillStyle = '#002a55'; c.strokeStyle = '#00aaff'; c.lineWidth = 1.5
      c.beginPath()
      c.moveTo(0, -h/2); c.lineTo(w/2, h*0.2); c.lineTo(w*0.35, h/2)
      c.lineTo(-w*0.35, h/2); c.lineTo(-w/2, h*0.2); c.closePath(); c.fill(); c.stroke()
      // Wings
      c.fillStyle = '#003866'; c.strokeStyle = '#0077cc'; c.lineWidth = 1
      for (const sign of [-1, 1]) {
        c.beginPath()
        c.moveTo(sign*w*0.35, h*0.1); c.lineTo(sign*w*0.5, h*0.2)
        c.lineTo(sign*w*0.45, h*0.45); c.lineTo(sign*w*0.2, h/2)
        c.closePath(); c.fill(); c.stroke()
      }
      // Cockpit
      c.shadowColor = '#aaffff'; c.shadowBlur = 8
      c.fillStyle = '#aaffff33'; c.strokeStyle = '#00eeff'; c.lineWidth = 1
      c.beginPath(); c.ellipse(0, -h*0.1, w*0.18, h*0.22, 0, 0, Math.PI*2); c.fill(); c.stroke()
      // Shield ring
      if (shieldHP.value > 0) {
        c.shadowColor = '#0088ff'; c.shadowBlur = 24
        c.strokeStyle = `rgba(0,160,255,${0.5 + 0.4 * Math.sin(Date.now() * 0.006)})`
        c.lineWidth = 3
        c.beginPath(); c.arc(0, 0, Math.max(w, h) * 0.75, 0, Math.PI*2); c.stroke()
      }

      // Charge energy — orbiting orbs + arc fill
      if (charge.active && charge.t > 0) {
        const ratio  = charge.t / CHARGE_MAX
        const cColor = ratio >= 0.99 ? '#ffffa0'
                     : ratio >= 0.7  ? '#ffcc00'
                     : '#cc88ff'
        const numOrbs = 2 + Math.floor(ratio * 5)
        c.shadowColor = cColor; c.shadowBlur = 18
        // Orbiting dots
        for (let i = 0; i < numOrbs; i++) {
          const a = (i / numOrbs) * Math.PI * 2 + Date.now() * 0.005
          const orR = 28 + ratio * 14
          c.globalAlpha = 0.6 + 0.4 * Math.sin(Date.now() * 0.008 + i)
          c.fillStyle = cColor
          c.beginPath()
          c.arc(Math.cos(a) * orR, Math.sin(a) * orR, 2 + ratio * 2.5, 0, Math.PI * 2)
          c.fill()
        }
        c.globalAlpha = 1
        // Charging arc (fills clockwise from top)
        c.strokeStyle = cColor
        c.lineWidth   = 2 + ratio * 2.5
        c.shadowBlur  = 12
        c.beginPath()
        c.arc(0, 0, 30 + ratio * 14, -Math.PI / 2, -Math.PI / 2 + ratio * Math.PI * 2)
        c.stroke()
        // Flare at arc tip for full charge
        if (ratio >= 0.99) {
          const tipA = -Math.PI / 2 + Math.PI * 2
          const tipR = 44
          c.globalAlpha = 0.7 + 0.3 * Math.sin(Date.now() * 0.02)
          c.fillStyle = '#ffffff'
          c.shadowBlur = 28
          c.beginPath()
          c.arc(Math.cos(tipA) * tipR, Math.sin(tipA) * tipR, 4, 0, Math.PI * 2)
          c.fill()
          c.globalAlpha = 1
        }
      }
      c.restore()
    }
  }

  // ── Float texts ─────────────────────────────────────────────────────────
  c.save()
  for (const f of floats) {
    c.globalAlpha = f.life / f.maxLife
    c.shadowColor = f.color; c.shadowBlur = 8
    c.font = 'bold 12px Orbitron, monospace'
    c.fillStyle = f.color; c.textAlign = 'center'
    c.fillText(f.text, f.x, f.y)
  }
  c.globalAlpha = 1; c.restore()

  c.restore()  // end shake

  // Screen flash overlay (phase transitions, teleports)
  if (screenFlash.alpha > 0.01) {
    c.globalAlpha = screenFlash.alpha
    c.fillStyle   = screenFlash.color
    c.fillRect(0, 0, VW, VH)
    c.globalAlpha = 1
  }

  // Crosshair drawn AFTER shake restore — always pixel-perfect on real cursor pos
  drawCrosshair(c)
}

// ─── Crosshair ────────────────────────────────────────────────────────────
function drawCrosshair(c) {
  if (!mouse.visible || gstate.value !== 'playing') return
  const { x, y } = mouse

  // Color shifts based on active power-up or danger state
  const isBoss   = bossActive
  const hasMulti = activePU.some(p => p.type === 'multi')
  const hasShield = activePU.some(p => p.type === 'shield')
  const color = isBoss   ? '#ff4400'
              : hasMulti ? '#ff9900'
              : hasShield? '#00aaff'
              : '#00ccff'
  const dimColor = color + '55'

  const gap   = 6    // gap around center
  const arm   = 14   // length of each arm
  const thick = 1.5  // line width
  const dotR  = 1.8  // center dot radius
  const outerR = 20  // outer circle radius
  const tick  = 4    // corner tick length

  c.save()
  c.shadowColor = color
  c.shadowBlur  = 8
  c.strokeStyle = color
  c.lineWidth   = thick
  c.lineCap     = 'round'

  // Four arms
  c.beginPath()
  c.moveTo(x - gap - arm, y); c.lineTo(x - gap, y)  // left
  c.moveTo(x + gap, y);       c.lineTo(x + gap + arm, y)  // right
  c.moveTo(x, y - gap - arm); c.lineTo(x, y - gap)  // top
  c.moveTo(x, y + gap);       c.lineTo(x, y + gap + arm)  // bottom
  c.stroke()

  // Outer circle (dashed, rotates slowly)
  const rot = (Date.now() * 0.0008) % (Math.PI * 2)
  c.save()
  c.translate(x, y)
  c.rotate(rot)
  c.strokeStyle = dimColor
  c.shadowBlur  = 0
  c.lineWidth   = 1
  c.setLineDash([4, 6])
  c.beginPath()
  c.arc(0, 0, outerR, 0, Math.PI * 2)
  c.stroke()
  c.setLineDash([])
  c.restore()

  // Corner ticks (static, inside the outer circle)
  c.strokeStyle = color
  c.shadowBlur  = 6
  c.lineWidth   = thick
  const d = outerR * 0.68
  for (const [sx, sy] of [[-1,-1],[1,-1],[1,1],[-1,1]]) {
    c.beginPath()
    c.moveTo(x + sx * d, y + sy * (d - tick))
    c.lineTo(x + sx * d, y + sy * d)
    c.lineTo(x + sx * (d - tick), y + sy * d)
    c.stroke()
  }

  // Center dot
  c.shadowBlur  = 12
  c.fillStyle   = color
  c.beginPath()
  c.arc(x, y, dotR, 0, Math.PI * 2)
  c.fill()

  // Pulsing glow ring when special power-up active
  if (hasMulti || hasShield || isBoss) {
    const pulse = 0.35 + 0.25 * Math.sin(Date.now() * 0.006)
    c.globalAlpha = pulse
    c.strokeStyle = color
    c.lineWidth   = 2
    c.shadowBlur  = 20
    c.beginPath()
    c.arc(x, y, outerR + 5, 0, Math.PI * 2)
    c.stroke()
    c.globalAlpha = 1
  }

  // Charge arc fills around crosshair while holding
  if (charge.active && charge.t > 0) {
    const ratio  = charge.t / CHARGE_MAX
    const cColor = ratio >= 0.99 ? '#ffffa0'
                 : ratio >= 0.7  ? '#ffcc00'
                 : '#cc88ff'
    const arcR = outerR + 12
    c.shadowColor = cColor; c.shadowBlur = 14
    c.strokeStyle = cColor
    c.lineWidth   = 3
    c.globalAlpha = 0.9
    c.beginPath()
    c.arc(x, y, arcR, -Math.PI / 2, -Math.PI / 2 + ratio * Math.PI * 2)
    c.stroke()
    // Dim track
    c.globalAlpha = 0.15
    c.beginPath(); c.arc(x, y, arcR, 0, Math.PI * 2); c.stroke()
    c.globalAlpha = 1
    c.shadowBlur = 0
  }

  c.restore()
}

// ─── Game loop ────────────────────────────────────────────────────────────
function loop(ts) {
  raf = requestAnimationFrame(loop)
  const dt = Math.min(ts - lastTime, 50)
  lastTime = ts
  if (gstate.value === 'playing') update(dt)
  draw()
}

// ─── Canvas sizing ────────────────────────────────────────────────────────
function resizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const scale = Math.min(window.innerWidth / VW, window.innerHeight / VH)
  canvas.style.width  = Math.round(VW * scale) + 'px'
  canvas.style.height = Math.round(VH * scale) + 'px'
  canvas.style.left   = Math.round((window.innerWidth  - VW * scale) / 2) + 'px'
  canvas.style.top    = Math.round((window.innerHeight - VH * scale) / 2) + 'px'
}

function getPos(cx, cy) {
  const r = canvasRef.value.getBoundingClientRect()
  return { x: (cx - r.left) / r.width * VW, y: (cy - r.top) / r.height * VH }
}

function onMouseMove(e) {
  const pos = getPos(e.clientX, e.clientY)
  mouse.x = pos.x
  mouse.y = pos.y
  mouse.visible = true
  if (!player || gstate.value !== 'playing') return
  player.tx = pos.x
}

function onMouseDown() {
  if (gstate.value !== 'playing' || !player) return
  if (charge.cooldown > 0) return   // still cooling
  charge.active = true
}

function onMouseUp() {
  if (!charge.active) return
  chargeShot()
}

function onMouseLeave() { mouse.visible = false }
function onMouseEnter() { mouse.visible = true }

function onTouchStart(e) {
  if (!player || gstate.value !== 'playing') return
  const t = e.touches[0]
  player.tx = getPos(t.clientX, t.clientY).x
  if (charge.cooldown <= 0) charge.active = true
}

function onTouchEnd() {
  if (!charge.active) return
  chargeShot()
}

// ─── Game control ─────────────────────────────────────────────────────────
function startGame() {
  bullets = []; enemies = []; particles = []; powerups = []; floats = []
  activePU.length = 0
  resetPlayer()
  score.value = 0; lives.value = MAX_LIVES; level.value = 1
  combo.value = 1; newRecord.value = false; bossActive = false; bossRef = null
  bossHpPct.value = -1; bossPhase2.value = false; shootTimer = 0; sessionKills = 0; sessionBossKills = 0
  charge.active = false; charge.t = 0; charge.cooldown = 0
  chargeLevel.value = 0; chargeCooling.value = false
  // Reset run stat trackers
  runStartTime = Date.now()
  runBulletsFired = 0; runChargeUsed = 0; runTimesHit = 0
  runShieldBlocks = 0; runPUCollected = 0; runMaxCombo = 1
  gstate.value = 'playing'
  startWave()
}

function advanceLevel() {
  bullets = []; enemies = []; particles = []; powerups = []; floats = []
  activePU.length = 0
  resetPlayer()
  combo.value = 1; bossActive = false; bossRef = null; bossHpPct.value = -1; bossPhase2.value = false; shootTimer = 0
  charge.active = false; charge.t = 0; charge.cooldown = 0
  chargeLevel.value = 0; chargeCooling.value = false
  gstate.value = 'playing'
  startWave()
}

function togglePause() {
  if (gstate.value === 'playing') gstate.value = 'paused'
  else if (gstate.value === 'paused') gstate.value = 'playing'
}

// ─── Lifecycle ────────────────────────────────────────────────────────────
onMounted(() => {
  const canvas = canvasRef.value
  canvas.width = VW; canvas.height = VH
  ctx = canvas.getContext('2d')
  initParallax(); resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  window.addEventListener('keydown', e => { if (e.key === 'p' || e.key === 'Escape') togglePause() })
  window.addEventListener('mouseup', () => { if (charge.active) chargeShot() })
  raf = requestAnimationFrame(loop)
})
onUnmounted(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', resizeCanvas)
})
>>>>>>> 1ebdd2ccc4dcb0dc520f402adc1eef4433bbfa26
</script>

<style scoped>
canvas { position: absolute; }
<<<<<<< HEAD
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
=======

.font-orbitron { font-family: 'Orbitron', monospace; }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

>>>>>>> 1ebdd2ccc4dcb0dc520f402adc1eef4433bbfa26
.bounce-in-enter-active { animation: bounceIn 0.4s cubic-bezier(.68,-.55,.27,1.55); }
.bounce-in-leave-active { transition: opacity 0.2s ease; }
.bounce-in-leave-to { opacity: 0; }
@keyframes bounceIn { from { transform:scale(0.6); opacity:0; } to { transform:scale(1); opacity:1; } }
<<<<<<< HEAD
.slide-in-enter-active { animation: slideIn 0.3s ease-out; }
.slide-in-leave-active { animation: slideIn 0.2s ease-in reverse; }
@keyframes slideIn { from { transform:translateY(-10px); opacity:0; } to { transform:translateY(0); opacity:1; } }
=======

.slide-in-enter-active { animation: slideIn 0.3s ease-out; }
.slide-in-leave-active { animation: slideIn 0.2s ease-in reverse; }
@keyframes slideIn { from { transform:translateY(-10px); opacity:0; } to { transform:translateY(0); opacity:1; } }

>>>>>>> 1ebdd2ccc4dcb0dc520f402adc1eef4433bbfa26
.combo-pop-enter-active { animation: comboPop 0.25s cubic-bezier(.34,1.56,.64,1); }
.combo-pop-leave-active { transition: opacity 0.2s; }
.combo-pop-leave-to { opacity: 0; }
@keyframes comboPop { from { transform:scale(0.5); opacity:0; } to { transform:scale(1); opacity:1; } }
<<<<<<< HEAD
=======

>>>>>>> 1ebdd2ccc4dcb0dc520f402adc1eef4433bbfa26
.pu-list-enter-active { animation: puIn 0.2s ease-out; }
.pu-list-leave-active { transition: opacity 0.3s; }
.pu-list-leave-to { opacity:0; }
@keyframes puIn { from { transform:scale(0.7) translateY(8px); opacity:0; } to { transform:scale(1) translateY(0); opacity:1; } }
</style>
