/* -------------------------
   UTILITIES & CONSTANTS
--------------------------*/
const stack    = document.getElementById('stack');
const orbCvs   = document.getElementById("orbCanvas");
const orbCtx   = orbCvs.getContext("2d");
const bgCvs    = document.getElementById("bgCanvas");
const bgCtx    = bgCvs.getContext("2d");
const footer   = document.querySelector('.footer'); // Reference to the footer element

const colors = ["#6B5DFF", "#FF5D8F", "#FFD75D", "#5DFFB4", "#5DD8FF", "#FF9E5D"];
let DPR = Math.min(2, window.devicePixelRatio || 1);

/* Prevent context menu / selection */
window.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('selectstart', e => e.preventDefault());
window.addEventListener('dragstart',  e => e.preventDefault());


/* -------------------------
   FOOTER REVEAL ON SCROLL
--------------------------*/
window.addEventListener('scroll', () => {
  // Check if user has scrolled near the bottom of the page
  const scrollThreshold = document.body.offsetHeight - window.innerHeight - 20;
  if (window.scrollY > scrollThreshold) {
    footer.classList.add('visible');
  } else {
    footer.classList.remove('visible');
  }
});


/* -------------------------
   ORBS
--------------------------*/
let orbs = [];
const orbCount = 6;
let w=0, h=0, centerX=0, centerY=0, radius=0;

function pxVar(name){
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0;
}

function resizeOrbsCanvas() {
  // Ensure stack element exists before getting its bounds
  if (!stack) return;
  const r = stack.getBoundingClientRect();
  const bleedX = pxVar('--orb-bleed-x');
  const bleedY = pxVar('--orb-bleed-y');

  w = Math.floor(r.width  + bleedX*2);
  h = Math.floor(r.height + bleedY*2);

  orbCvs.width  = Math.floor(w * DPR);
  orbCvs.height = Math.floor(h * DPR);
  orbCvs.style.width  = w + 'px';
  orbCvs.style.height = h + 'px';
  orbCtx.setTransform(DPR,0,0,DPR,0,0);

  centerX = w / 2;
  centerY = h / 2;
  const cardShortSide = Math.min(r.width, r.height);
  radius  = cardShortSide * 0.48;
}

if(!orbs.length){
  for (let i = 0; i < orbCount; i++) {
    orbs.push({
      angle: (Math.PI * 2 * i) / orbCount,
      speed: 0.0015,
      color: colors[i % colors.length],
      x: 0, y: 0, vx: 0, vy: 0
    });
  }
}

function drawOrbs() {
  orbCtx.clearRect(0, 0, w, h);
  for (let orb of orbs) {
    orb.angle += orb.speed;
    orb.x = centerX + Math.cos(orb.angle) * radius + orb.vx;
    orb.y = centerY + Math.sin(orb.angle) * radius + orb.vy;
    orb.vx *= 0.9;
    orb.vy *= 0.9;

    const coreR = 13.2;
    const haloR = coreR * 3.6;
    const outerR = coreR * 5.0;

    // outer aura
    let g = orbCtx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, outerR);
    g.addColorStop(0.0, hexToRgba(orb.color, 0.09));
    g.addColorStop(1.0, "rgba(0,0,0,0)");
    orbCtx.globalCompositeOperation = "lighter";
    orbCtx.fillStyle = g;
    orbCtx.beginPath(); orbCtx.arc(orb.x, orb.y, outerR, 0, Math.PI*2); orbCtx.fill();

    // halo
    g = orbCtx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, haloR);
    g.addColorStop(0.0, hexToRgba(orb.color, 0.78));
    g.addColorStop(0.5, hexToRgba(orb.color, 0.25));
    g.addColorStop(1.0, "rgba(0,0,0,0)");
    orbCtx.fillStyle = g;
    orbCtx.beginPath(); orbCtx.arc(orb.x, orb.y, haloR, 0, Math.PI*2); orbCtx.fill();

    // bright core + tiny highlight
    orbCtx.globalCompositeOperation = "source-over";
    orbCtx.shadowBlur = 18;
    orbCtx.shadowColor = orb.color;
    orbCtx.fillStyle = orb.color;
    orbCtx.beginPath(); orbCtx.arc(orb.x, orb.y, coreR, 0, Math.PI*2); orbCtx.fill();
    orbCtx.shadowBlur = 0;

    orbCtx.globalCompositeOperation = "screen";
    orbCtx.fillStyle = "rgba(255,255,255,0.3)";
    orbCtx.beginPath(); orbCtx.arc(orb.x - coreR*0.35, orb.y - coreR*0.35, coreR*0.35, 0, Math.PI*2); orbCtx.fill();
    orbCtx.globalCompositeOperation = "source-over";
  }
}

/* -------------------------
   BACKGROUND SHOCKWAVES
--------------------------*/
let bw = 0, bh = 0;
const waves = [];

function resizeBgCanvas(){
  bw = bgCvs.width  = Math.floor(window.innerWidth  * DPR);
  bh = bgCvs.height = Math.floor(window.innerHeight * DPR);
  bgCvs.style.width  = window.innerWidth  + 'px';
  bgCvs.style.height = window.innerHeight + 'px';
  bgCtx.setTransform(DPR,0,0,DPR,0,0);
}
resizeBgCanvas();

function spawnWave(){
  const x = Math.random() * (bw / DPR);
  const y = Math.random() * (bh / DPR);
  const color = colors[Math.floor(Math.random() * colors.length)];
  waves.push({
    x, y,
    r: 0,
    maxR: Math.random()*160 + 220,
    color,
    alpha: 0.18,
    dr: 0.8 + Math.random()*0.3,
    bands: 3 + Math.floor(Math.random()*2),
    gap: 14,
    lw: 2.2
  });
}

let lastWaveTime = 0;
function drawBg(ts){
  bgCtx.clearRect(0,0,bw/DPR,bh/DPR);

  if(!lastWaveTime || ts - lastWaveTime > (1600 + Math.random()*1600)){
    spawnWave();
    lastWaveTime = ts;
  }

  bgCtx.globalCompositeOperation = 'screen';

  for(let i=waves.length-1; i>=0; i--){
    const wv = waves[i];
    wv.r += wv.dr;
    const progress = Math.min(1, wv.r / wv.maxR);
    const envelope = Math.sin(Math.PI * progress);

    for(let b=0; b<wv.bands; b++){
      const rr = wv.r - b*wv.gap;
      if(rr <= 0) continue;

      const a = Math.max(0, wv.alpha * envelope * Math.pow(0.72, b));

      bgCtx.strokeStyle = hexToRgba(wv.color, a);
      bgCtx.lineWidth = wv.lw + b * 0.6;
      bgCtx.shadowBlur = 8;
      bgCtx.shadowColor = hexToRgba(wv.color, a * 0.9);
      bgCtx.beginPath();
      bgCtx.arc(wv.x, wv.y, rr, 0, Math.PI*2);
      bgCtx.stroke();
      bgCtx.shadowBlur = 0;

      const glowR = rr + 18;
      const g = bgCtx.createRadialGradient(wv.x, wv.y, rr * 0.92, wv.x, wv.y, glowR);
      g.addColorStop(0.0, hexToRgba(wv.color, a * 0.18));
      g.addColorStop(1.0, "rgba(0,0,0,0)");
      bgCtx.fillStyle = g;
      bgCtx.beginPath();
      bgCtx.arc(wv.x, wv.y, glowR, 0, Math.PI*2);
      bgCtx.fill();
    }

    if(progress >= 1) waves.splice(i,1);
  }

  bgCtx.globalCompositeOperation = 'source-over';
}

/* -------------------------
   RENDER LOOPS & EVENTS
--------------------------*/
function hexToRgba(hex, a){
  const c = hex.replace('#','');
  const r = parseInt(c.substring(0,2),16);
  const g = parseInt(c.substring(2,4),16);
  const b = parseInt(c.substring(4,6),16);
  return `rgba(${r},${g},${b},${a})`;
}

function onResize(){
  DPR = Math.min(2, window.devicePixelRatio || 1);
  resizeOrbsCanvas();
  resizeBgCanvas();
}
window.addEventListener("resize", onResize, {passive:true});
window.addEventListener("click", ()=>{}, {passive:true});
window.addEventListener("touchstart", ()=>{}, {passive:true});

/* Start loops */
resizeOrbsCanvas();
(function animate(ts){
  drawOrbs();
  drawBg(ts || 0);
  requestAnimationFrame(animate);
})();