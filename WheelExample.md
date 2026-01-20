This Document provides example code of how to achieve what we want with our spinning wheel application. However, we want to make sure to consolidate this code example with our design requirements and domain specificity as described in WheelDesign.md. 

```html

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Physics Wheel with Pegs & User Torque</title>
<style>
  body {
    background: #111;
    color: #eee;
    font-family: system-ui, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    margin: 0;
  }

  canvas {
    background: #222;
  }

  .controls {
    margin-top: 12px;
    display: flex;
    gap: 10px;
  }

  button {
    padding: 10px 14px;
    font-size: 14px;
    cursor: pointer;
  }

  .readout {
    margin-top: 10px;
    color: #ffcc00;
    text-align: center;
  }
</style>
</head>
<body>

<canvas id="canvas" width="420" height="420"></canvas>

<div class="controls">
  <button id="spinBtn">Spin</button>
  <button id="fasterBtn">Nudge Faster</button>
  <button id="slowerBtn">Nudge Slower</button>
</div>

<div class="readout" id="readout"></div>

<script>
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const readout = document.getElementById("readout");

const cx = canvas.width / 2;
const cy = canvas.height / 2;
const radius = 160;

/* ---------- Wheel slices ---------- */
const slices = [
  "Enhancement Shaman","Unholy DK","Frost Mage","Fire Mage",
  "Frost DK","WW Monk","Elemental Sham","Arms Warrior"
];

const N = slices.length;
const sliceAngle = (Math.PI * 2) / N;

/* ---------- Pegs ---------- */
const pegs = [];
for (let i = 0; i < N; i++) pegs.push(i * sliceAngle);
const pegRadius = 6;

/* ---------- Physics ---------- */
let theta = 0;
let omega = 0;

const I = 1;
const baseDamping = 0.2;

/* ---------- Pointer ---------- */
const pointerAngle = -Math.PI / 2;

/* Pointer resistance (dominant braking force) */
const pointerStiffness = 4;
const pointerDamping = 1;
const contactWindow = 0.12;

/* ---------- Timing ---------- */
let lastTime = null;

/* ---------- Utilities ---------- */
function normalizeAngle(a) {
  a %= Math.PI * 2;
  return a < 0 ? a + Math.PI * 2 : a;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/* ---------- Drawing ---------- */
function drawWheel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(theta);

  /* Slices */
  for (let i = 0; i < N; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, i * sliceAngle, (i + 1) * sliceAngle);
    ctx.closePath();
    ctx.fillStyle = i % 2 ? "#444" : "#333";
    ctx.fill();
    ctx.strokeStyle = "#666";
    ctx.stroke();

    ctx.save();
    ctx.rotate(i * sliceAngle + sliceAngle / 2);
    ctx.translate(radius * 0.65, 0);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = "#ffcc00";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(slices[i], 0, 0);
    ctx.restore();
  }

  /* Pegs */
  ctx.fillStyle = "#ccc";
  for (let a of pegs) {
    ctx.beginPath();
    ctx.arc(
      Math.cos(a) * radius,
      Math.sin(a) * radius,
      pegRadius,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  ctx.restore();

  /* Pointer */
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(pointerAngle);
  ctx.beginPath();
  ctx.moveTo(radius + 5, 0);
  ctx.lineTo(radius + 35, 0);
  ctx.strokeStyle = "#ff4444";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
}

/* ---------- Simulation ---------- */
function update(time) {
  if (!lastTime) lastTime = time;
  const dt = (time - lastTime) / 1000;
  lastTime = time;

  let torque = -baseDamping * omega;

  /* Peg–pointer interaction */
  for (let pegAngle of pegs) {
    const pegWorld = normalizeAngle(theta + pegAngle);
    const diff = angleDiff(pegWorld, pointerAngle);

    if (
      (omega > 0 && diff < 0 && diff > -contactWindow) ||
      (omega < 0 && diff > 0 && diff < contactWindow)
    ) {
      const penetration = Math.abs(diff);
      const direction = Math.sign(omega);

      torque +=
        -direction * pointerStiffness * penetration
        -direction * pointerDamping * Math.abs(omega);
    }
  }

  /* Integrate */
  const alpha = torque / I;
  omega += alpha * dt;
  theta += omega * dt;

  if (Math.abs(omega) < 0.0005) omega = 0;

  drawWheel();
  updateReadout();
  requestAnimationFrame(update);
}

/* ---------- Readout ---------- */
function updateReadout() {
  const wheelAngle = normalizeAngle(pointerAngle - theta);
  const sliceIndex = Math.floor(wheelAngle / sliceAngle);

  readout.innerHTML = `
    <div>Angular velocity: ${omega.toFixed(2)} rad/s</div>
    <div>Selected slice: <strong>${slices[sliceIndex]}</strong></div>
  `;
}

/* ---------- User torque impulses ---------- */
function applyImpulse(impulse) {
  omega += impulse / I;
}

document.getElementById("spinBtn").onclick = () => applyImpulse(22);
document.getElementById("fasterBtn").onclick = () => applyImpulse(4);
document.getElementById("slowerBtn").onclick = () => applyImpulse(-2);

/* ---------- Start ---------- */
requestAnimationFrame(update);
</script>

</body>
</html>
```
