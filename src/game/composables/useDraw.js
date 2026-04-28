import { state } from '../state.js'
import { VW, VH } from '../constants.js'
import { activePU, shieldHP, chargeLevel as chargeLevelRef } from '../store.js'
import { useParallax } from './useParallax.js'
import { usePlayer }   from './usePlayer.js'

const { draw: drawParallax } = useParallax()
const { draw: drawPlayer }   = usePlayer()

export function useDraw() {
  // ── Enemies ───────────────────────────────────────────────────────────────
  function drawEnemies(c) {
    for (const e of state.enemies) {
      c.save(); c.translate(e.x, e.y)

      if (e.type === 'asteroid') {
        c.rotate(e.angle)
        c.shadowColor = '#aa6633'; c.shadowBlur = 8
        c.fillStyle   = e.hp > 1 ? '#6a4f2e' : '#8a6040'
        c.strokeStyle = '#c49a6c'; c.lineWidth = 1.5
        c.beginPath()
        e.verts.forEach((v, i) => i === 0 ? c.moveTo(v.x, v.y) : c.lineTo(v.x, v.y))
        c.closePath(); c.fill(); c.stroke()
        c.shadowBlur = 0
        if (e.maxHp > 1) {
          c.strokeStyle = '#c49a6c55'; c.lineWidth = 0.8
          c.beginPath(); c.moveTo(-e.r*.3,-e.r*.2); c.lineTo(e.r*.2,e.r*.3); c.stroke()
          c.beginPath(); c.moveTo(e.r*.1,-e.r*.4); c.lineTo(-e.r*.2,e.r*.1); c.stroke()
        }

      } else if (e.type === 'ufo') {
        c.shadowColor = '#44ff88'; c.shadowBlur = 16
        c.fillStyle = '#1a3a1a'; c.strokeStyle = '#44ff88'; c.lineWidth = 1.5
        c.beginPath(); c.ellipse(0,4,e.w/2,e.h/2*.55,0,0,Math.PI*2); c.fill(); c.stroke()
        c.fillStyle = '#2a4a2a'; c.strokeStyle = '#66ff66'; c.lineWidth = 1
        c.beginPath(); c.ellipse(0,-2,e.w*.28,e.h*.5,0,Math.PI,0); c.fill(); c.stroke()
        c.shadowBlur = 0
        const lc = ['#ff4444','#ffff44','#44ff44','#44ffff','#ff44ff']
        for (let i = 0; i < 5; i++) {
          const a = (i/5)*Math.PI*2 + e.sineT
          c.fillStyle = lc[i]; c.beginPath(); c.arc(Math.cos(a)*e.w*.38, 4+Math.sin(a)*e.h*.15, 2.5, 0, Math.PI*2); c.fill()
        }
        if (e.hp < e.maxHp) {
          const bw = e.w * .85
          c.fillStyle='#440000'; c.fillRect(-bw/2,-e.h/2-10,bw,4)
          c.fillStyle='#44ff44'; c.fillRect(-bw/2,-e.h/2-10,bw*e.hp/e.maxHp,4)
        }

      } else if (e.type === 'dart') {
        c.rotate(e.angle)
        c.shadowColor = e.kamikaze?'#ff00ff':'#ff4444'; c.shadowBlur = 14
        c.fillStyle   = e.kamikaze?'#440044':'#aa1111'
        c.strokeStyle = e.kamikaze?'#ff44ff':'#ff6666'; c.lineWidth = 1.5
        c.beginPath()
        c.moveTo(0,e.h/2); c.lineTo(-e.w/2,-e.h/2); c.lineTo(0,-e.h/2*.5); c.lineTo(e.w/2,-e.h/2); c.closePath()
        c.fill(); c.stroke()
        c.shadowBlur = 0
        c.fillStyle = (e.kamikaze?'#ff00ff':'#ff6600')+'99'
        c.beginPath(); c.moveTo(-5,e.h/2); c.lineTo(5,e.h/2); c.lineTo(0,e.h/2+10+Math.random()*6); c.closePath(); c.fill()

      } else if (e.type === 'formation') {
        c.rotate(e.angle)
        const tint = e.tint || '#ff8844'
        c.shadowColor = tint; c.shadowBlur = e.isLeader ? 16 : 10
        c.fillStyle   = e.diving ? tint+'cc' : e.isLeader ? tint.replace('ff','88')+'44' : '#1a0010'
        c.strokeStyle = tint; c.lineWidth = e.isLeader ? 2 : 1.5
        c.beginPath()
        c.moveTo(0,-e.h/2); c.lineTo(-e.w/2,e.h*.25); c.lineTo(-e.w*.22,e.h/2)
        c.lineTo(e.w*.22,e.h/2); c.lineTo(e.w/2,e.h*.25); c.closePath()
        c.fill(); c.stroke()
        c.shadowBlur = 6; c.fillStyle = e.diving?'#ffffff':tint
        c.beginPath(); c.arc(0,-e.h/2,2.5,0,Math.PI*2); c.fill()
        c.shadowBlur = 0; c.fillStyle = tint+'88'
        const fl = 6+Math.random()*(e.diving?8:5)
        c.beginPath(); c.moveTo(-4,e.h/2); c.lineTo(4,e.h/2); c.lineTo(0,e.h/2+fl); c.closePath(); c.fill()
        if (e.isLeader && !e.diving) {
          c.shadowColor = tint; c.shadowBlur = 8; c.fillStyle='#ffffff'
          c.beginPath(); c.arc(0,-e.h/2-8,2,0,Math.PI*2); c.fill()
        }

      } else if (e.type === 'boss') {
        drawBoss(c, e)
      }
      c.restore()
    }
  }

  function drawBoss(c, e) {
    const w = e.w, h = e.h
    const pulse = 0.5 + 0.5 * Math.sin(e.t * 0.003)
    const p2 = e.p2, rage = e.p2rage

    if (p2) {
      const vigA = rage ? 0.08+0.04*Math.sin(e.t*.005) : 0.04+0.02*Math.sin(e.t*.003)
      c.globalAlpha = vigA
      const vig = c.createRadialGradient(VW/2, 0, VH*.3, VW/2, 0, VH*1.1)
      vig.addColorStop(0,'transparent'); vig.addColorStop(1, rage?'#ff0066':'#6600cc')
      c.fillStyle = vig; c.fillRect(0,0,VW,VH)
      c.globalAlpha = 1
    }

    const hullStroke = p2?(rage?'#ff44aa':'#cc44ff'):'#ff3300'
    c.shadowColor = hullStroke; c.shadowBlur = 22+pulse*16
    c.fillStyle   = p2?(rage?'#250020':'#1a0030'):'#2a0008'
    c.strokeStyle = hullStroke; c.lineWidth = 2
    c.beginPath()
    c.moveTo(0,-h/2); c.lineTo(w/2,-h*.1); c.lineTo(w*.42,h/2)
    c.lineTo(-w*.42,h/2); c.lineTo(-w/2,-h*.1); c.closePath(); c.fill(); c.stroke()

    if (p2) {
      const coreR = 22+pulse*8
      c.shadowColor = rage?'#ff0066':'#aa00ff'; c.shadowBlur = 36
      c.fillStyle = `rgba(${rage?'255,0,100':'180,0,255'},${0.75+pulse*.25})`
      c.beginPath(); c.arc(0,0,coreR,0,Math.PI*2); c.fill()
      c.fillStyle = `rgba(255,255,255,${0.5+pulse*.4})`
      c.beginPath(); c.arc(0,0,coreR*.38,0,Math.PI*2); c.fill()
      c.globalAlpha=0.35+pulse*.3; c.strokeStyle=rage?'#ff44aa':'#dd44ff'; c.lineWidth=2; c.shadowBlur=18
      c.beginPath(); c.arc(0,0,coreR*1.6,0,Math.PI*2); c.stroke(); c.globalAlpha=1
      const rings = rage?3:2
      for (let ri=0;ri<rings;ri++) {
        const rA = e.p2orbitAngle+(ri/rings)*Math.PI*2, rR=52+ri*18
        c.globalAlpha=0.35+0.2*Math.sin(e.t*.004+ri)
        c.strokeStyle=rage?'#ff44aa':'#aa44ff'; c.lineWidth=1.5; c.shadowColor=rage?'#ff0066':'#8800cc'; c.shadowBlur=10
        c.save(); c.rotate(rA); c.setLineDash([6,8])
        c.beginPath(); c.arc(0,0,rR,0,Math.PI*2); c.stroke(); c.setLineDash([])
        c.globalAlpha=0.65; c.fillStyle=rage?'#ff88cc':'#cc88ff'
        c.beginPath(); c.arc(rR,0,3.5,0,Math.PI*2); c.fill(); c.restore(); c.globalAlpha=1
      }
    } else {
      c.shadowColor='#ff0000'; c.shadowBlur=32
      c.fillStyle=`rgba(255,${60+pulse*80},0,${0.8+pulse*.2})`
      c.beginPath(); c.arc(0,0,20+pulse*7,0,Math.PI*2); c.fill()
    }

    c.shadowBlur=8; c.strokeStyle=p2?(rage?'#ff66bb':'#aa66ff'):'#ff6600'; c.lineWidth=1.5
    for (const sign of [-1,1]) {
      c.beginPath(); c.moveTo(sign*22,-12); c.lineTo(sign*w*.42,0); c.lineTo(sign*w*.36,h*.3); c.stroke()
    }
    c.shadowBlur=0; c.fillStyle=p2?(rage?'#ff0066':'#aa00ff'):'#ff4400'
    for (let i=-2;i<=2;i++) { c.beginPath(); c.arc(i*24,h/2-8,4.5,0,Math.PI*2); c.fill() }

    if (e.p2flashAlpha>0) {
      c.globalAlpha=e.p2flashAlpha*.7; c.fillStyle=rage?'#ff44aa':'#dd88ff'
      c.beginPath(); c.arc(0,0,Math.max(w,h)*.9,0,Math.PI*2); c.fill(); c.globalAlpha=1
    }
    c.shadowBlur=0; c.font='bold 10px Orbitron,monospace'; c.textAlign='center'
    if (e.phase===0) { c.fillStyle='#ff660066'; c.fillText('ENTERING...',0,-h/2-14) }
    else if (rage) { c.fillStyle=`rgba(255,68,136,${0.6+0.4*Math.sin(e.t*.01)})`; c.fillText('RAGE',0,-h/2-14) }
    else if (p2)   { c.fillStyle=`rgba(180,80,255,${0.5+0.3*Math.sin(e.t*.006)})`; c.fillText('PHASE 2',0,-h/2-14) }
  }

  // ── Bullets ───────────────────────────────────────────────────────────────
  function drawBullets(c) {
    for (const b of state.bullets) {
      c.save()
      if (b.charged) {
        const pulse = 0.65+0.35*Math.sin(Date.now()*.018)
        c.shadowColor=b.glow||b.color; c.shadowBlur=30+pulse*24
        c.globalAlpha=0.25; c.fillStyle=b.color
        c.beginPath(); c.arc(b.x,b.y,b.r*1.8,0,Math.PI*2); c.fill()
        c.globalAlpha=0.55; c.beginPath(); c.arc(b.x,b.y,b.r,0,Math.PI*2); c.fill()
        c.globalAlpha=1; c.fillStyle='#ffffff'
        c.beginPath(); c.arc(b.x,b.y,b.r*.4,0,Math.PI*2); c.fill()
        c.globalAlpha=0.7; c.strokeStyle=b.color; c.lineWidth=1.5; c.shadowBlur=8
        c.save(); c.translate(b.x,b.y); c.rotate(Date.now()*.006); c.setLineDash([4,5])
        c.beginPath(); c.arc(0,0,b.r*1.3,0,Math.PI*2); c.stroke(); c.setLineDash([]); c.restore()
        c.globalAlpha=1
      } else if (b.owner==='player') {
        c.shadowColor='#00ccff'; c.shadowBlur=12; c.fillStyle='#aaffff'
        c.beginPath()
        if (c.roundRect) c.roundRect(b.x-b.w/2,b.y-b.h/2,b.w,b.h,2)
        else c.rect(b.x-b.w/2,b.y-b.h/2,b.w,b.h)
        c.fill(); c.fillStyle='#ffffff'; c.fillRect(b.x-b.w/2+1,b.y-b.h/2,b.w-2,5)
      } else {
        c.shadowColor=b.color; c.shadowBlur=10; c.fillStyle=b.color
        c.beginPath(); c.arc(b.x,b.y,b.w/2+1,0,Math.PI*2); c.fill()
      }
      c.restore()
    }
  }

  // ── Particles + floats ────────────────────────────────────────────────────
  function drawParticles(c) {
    for (const p of state.particles) {
      c.globalAlpha = p.life / p.maxLife
      c.fillStyle   = p.color
      c.beginPath(); c.arc(p.x, p.y, p.size*(p.life/p.maxLife), 0, Math.PI*2); c.fill()
    }
    c.globalAlpha = 1
  }

  function drawFloats(c) {
    c.save()
    for (const f of state.floats) {
      c.globalAlpha = f.life / f.maxLife
      c.shadowColor = f.color; c.shadowBlur = 8
      c.font = 'bold 12px Orbitron,monospace'
      c.fillStyle = f.color; c.textAlign = 'center'
      c.fillText(f.text, f.x, f.y)
    }
    c.globalAlpha = 1; c.restore()
  }

  // ── Power-ups ─────────────────────────────────────────────────────────────
  function drawPowerups(c) {
    for (const p of state.powerups) {
      c.save(); c.translate(p.x, p.y); c.rotate(p.angle)
      c.shadowColor=p.color; c.shadowBlur=14
      c.fillStyle=p.color+'22'; c.strokeStyle=p.color; c.lineWidth=1.5
      c.beginPath()
      for (let i=0;i<6;i++) { const a=(i/6)*Math.PI*2; i===0?c.moveTo(Math.cos(a)*13,Math.sin(a)*13):c.lineTo(Math.cos(a)*13,Math.sin(a)*13) }
      c.closePath(); c.fill(); c.stroke()
      c.shadowBlur=0; c.font='14px Sarabun'; c.textAlign='center'; c.textBaseline='middle'
      c.fillText(p.icon, 0, 1); c.restore()
    }
  }

  // ── Crosshair ─────────────────────────────────────────────────────────────
  function drawCrosshair(c, gstate) {
    if (!state.mouse.visible || gstate !== 'playing') return
    const { x, y } = state.mouse
    const isBoss   = state.bossActive
    const hasMulti = activePU.some(p => p.type === 'multi')
    const hasShield = activePU.some(p => p.type === 'shield')
    const color = isBoss?'#ff4400':hasMulti?'#ff9900':hasShield?'#00aaff':'#00ccff'
    const dim   = color+'55'
    const gap=6, arm=14, thick=1.5, dotR=1.8, outerR=20

    c.save()
    c.shadowColor=color; c.shadowBlur=8; c.strokeStyle=color; c.lineWidth=thick; c.lineCap='round'
    c.beginPath()
    c.moveTo(x-gap-arm,y); c.lineTo(x-gap,y)
    c.moveTo(x+gap,y);     c.lineTo(x+gap+arm,y)
    c.moveTo(x,y-gap-arm); c.lineTo(x,y-gap)
    c.moveTo(x,y+gap);     c.lineTo(x,y+gap+arm)
    c.stroke()

    c.save(); c.translate(x,y); c.rotate((Date.now()*.0008)%(Math.PI*2))
    c.strokeStyle=dim; c.shadowBlur=0; c.lineWidth=1; c.setLineDash([4,6])
    c.beginPath(); c.arc(0,0,outerR,0,Math.PI*2); c.stroke(); c.setLineDash([]); c.restore()

    c.strokeStyle=color; c.shadowBlur=6; c.lineWidth=thick
    const d=outerR*.68
    for (const [sx,sy] of [[-1,-1],[1,-1],[1,1],[-1,1]]) {
      c.beginPath()
      c.moveTo(x+sx*d,y+sy*(d-4)); c.lineTo(x+sx*d,y+sy*d); c.lineTo(x+sx*(d-4),y+sy*d); c.stroke()
    }
    c.shadowBlur=12; c.fillStyle=color; c.beginPath(); c.arc(x,y,dotR,0,Math.PI*2); c.fill()

    if (hasMulti||hasShield||isBoss) {
      c.globalAlpha=0.35+0.25*Math.sin(Date.now()*.006)
      c.strokeStyle=color; c.lineWidth=2; c.shadowBlur=20
      c.beginPath(); c.arc(x,y,outerR+5,0,Math.PI*2); c.stroke(); c.globalAlpha=1
    }
    if (state.charge.active && state.charge.t > 0) {
      const ratio  = state.charge.t / 1200
      const cColor = ratio>=0.99?'#ffffa0':ratio>=0.7?'#ffcc00':'#cc88ff'
      const arcR   = outerR+12
      c.shadowColor=cColor; c.shadowBlur=14; c.strokeStyle=cColor; c.lineWidth=3; c.globalAlpha=0.9
      c.beginPath(); c.arc(x,y,arcR,-Math.PI/2,-Math.PI/2+ratio*Math.PI*2); c.stroke()
      c.globalAlpha=0.15; c.beginPath(); c.arc(x,y,arcR,0,Math.PI*2); c.stroke(); c.globalAlpha=1
    }
    c.restore()
  }

  // ── Main draw call ────────────────────────────────────────────────────────
  function draw(gstate) {
    const c = state.ctx
    if (!c) return
    c.save()
    if (state.shake>0.5) c.translate((Math.random()-.5)*state.shake, (Math.random()-.5)*state.shake)

    c.fillStyle='#000814'; c.fillRect(0,0,VW,VH)
    drawParallax(c)
    drawParticles(c)
    drawPowerups(c)
    drawEnemies(c)
    drawBullets(c)
    drawPlayer(c)
    drawFloats(c)
    c.restore()

    if (state.screenFlash.alpha>0.01) {
      c.globalAlpha=state.screenFlash.alpha; c.fillStyle=state.screenFlash.color
      c.fillRect(0,0,VW,VH); c.globalAlpha=1
    }
    drawCrosshair(c, gstate)
  }

  return { draw }
}
