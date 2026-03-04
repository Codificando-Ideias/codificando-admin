
const canvas = document.getElementById("heroCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const particles = [];
for (let i = 0; i < 80; i++) {
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2
  });
}

let animationFrameId = null;
let isRunning = false;

function renderFrame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#2563EB";

  particles.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    p.y += 0.5;
    if (p.y > canvas.height) p.y = 0;
  });

  animationFrameId = requestAnimationFrame(renderFrame);
}

function startAnimation() {
  if (isRunning) return;
  isRunning = true;
  animationFrameId = requestAnimationFrame(renderFrame);
}

function stopAnimation() {
  if (!isRunning) return;
  cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
  isRunning = false;
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopAnimation();
  } else {
    startAnimation();
  }
});

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

startAnimation();
