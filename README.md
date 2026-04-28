# 🚀 Space Shooter — Vue 3 + Vite + Tailwind CSS

## เริ่มเกม

```bash
npm install
npm run dev
```

เปิด **http://localhost:5173**

---

## ระบบ Difficulty ที่ค่อยๆ ยากขึ้น

| ด่าน   | ชื่อ   | สิ่งใหม่ที่เพิ่ม |
|--------|--------|-----------------|
| 1–2    | EASY   | อุกกาบาตช้า, เรียนรู้พื้นฐาน |
| 3–4    | NORMAL | UFO เริ่มปรากฏ, เคลื่อนซิกแซก |
| 5–6    | HARD   | ศัตรูยิงกลับ, Kamikaze dart |
| 7–9    | EXPERT | Boss ทุกด่าน, ยิง 5 ทิศ |
| 10+    | INSANE | ทุกอย่างเร็วขึ้น, ไม่มีที่สิ้นสุด |

**ค่าที่ ramp ตาม level:**
- ความเร็วศัตรู: `1.2 + level × 0.18`
- spawn interval: `max(500, 2500 - level × 140)` ms
- จำนวนศัตรูต่อด่าน: `5 + level × 2`
- UFO ยิงกลับ: เร็วขึ้นทุกด่าน
- Boss HP: `25 + level × 10`

## Power-ups

| ไอเทม | ผล |
|-------|-----|
| 🔫 MULTI  | ยิง 3 ลูกพร้อมกัน |
| 🛡️ SHIELD | กันดาเมจ 3 ครั้ง |
| ⚡ SPEED  | เรือเร็วขึ้น |
| ❤️ LIFE   | +1 ชีวิต |
| 💣 BOMB   | ระเบิดล้างหน้าจอ |

## Tech stack

- **Vue 3** Composition API (`ref`, `reactive`, `computed`)
- **Vite** — HMR dev server
- **Tailwind CSS v3** — utility classes สำหรับ UI/HUD ทั้งหมด
- **Canvas 2D API** — render เกม, particle, enemies
- **requestAnimationFrame** — game loop 60fps
- **localStorage** — highscore, bestLevel, totalKills, bossKills

## โครงสร้าง

```
src/
├── main.js       # createApp
├── style.css     # Tailwind + @layer components
├── App.vue       # root wrapper
└── Game.vue      # ทุกอย่าง: engine + UI overlays
```
