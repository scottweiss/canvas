import { createSimulation, encodeCell } from "./simulation.mjs";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const width = window.innerWidth;
const height = window.innerHeight;
let cellSize = 50;

const pauseBtn = document.getElementById("pause-resume-btn");

// Preserve the existing initial board
const sim = createSimulation(new Set([
  "1,0",
  "2,1",
  "2,2",
  "1,2",
  "0,2"
]));

canvas.width = width;
canvas.height = height;

// --- Rendering ---

function drawCell(row, column, dead) {
  const x = row * cellSize;
  const y = column * cellSize;

  ctx.strokeStyle = `#000`;
  ctx.fillStyle = dead ? `#fff` : `#000`;

  ctx.fillRect(x, y, cellSize, cellSize);
  ctx.strokeRect(x, y, cellSize, cellSize);
}

function renderBoard() {
  const columns = Math.ceil(canvas.width / cellSize);
  const rows = Math.ceil(canvas.height / cellSize);
  for (let i = 0; i < columns; i++) {
    for (let j = 0; j < rows; j++) {
      drawCell(i, j, !sim.isAlive(encodeCell(i, j)));
    }
  }
}

// --- Button state ---

function updateButtonLabel() {
  pauseBtn.textContent = sim.getLabel();
  pauseBtn.setAttribute("aria-pressed", String(!sim.isPausedState()));
}

function togglePause() {
  sim.togglePause();
  updateButtonLabel();
}

// --- Single persistent animation loop (exactly one, regardless of toggles/resize/zoom) ---

const FPS = 5;
const fpsInterval = 1000 / FPS;
let lastFrameTime = 0;

function animate(timestamp) {
  requestAnimationFrame(animate);

  if (sim.isPausedState()) {
    lastFrameTime = timestamp;
    return;
  }

  if (timestamp - lastFrameTime >= fpsInterval) {
    lastFrameTime = timestamp - ((timestamp - lastFrameTime) % fpsInterval);
    sim.step();
    renderBoard();
  }
}

// --- Initialization ---

renderBoard();
updateButtonLabel();
requestAnimationFrame(animate);

// --- Event handlers ---

// Canvas click: toggle a cell (only on canvas, not on the button)
canvas.addEventListener("click", function (event) {
  const x = Math.floor(event.clientX / cellSize);
  const y = Math.floor(event.clientY / cellSize);
  const cell = encodeCell(x, y);
  sim.toggleCell(cell);
  drawCell(x, y, !sim.isAlive(cell));
}, false);

// Button click: toggle pause/resume without editing a cell
pauseBtn.addEventListener("click", function (event) {
  event.stopPropagation();
  event.preventDefault();
  togglePause();
}, false);

// Space key shortcut: toggle pause/resume
// Skip if the button is the target (button will handle it via its own click on Space)
document.addEventListener("keydown", function (event) {
  if (event.code === 'Space') {
    if (event.target === pauseBtn) {
      return; // Button will fire its own click event on Space
    }
    event.preventDefault();
    togglePause();
  }
}, false);

// Prevent button from triggering its click when Space is pressed while focused
// (browsers fire click on keyup for buttons; we prevent the default to avoid double-toggle)
pauseBtn.addEventListener("keydown", function (event) {
  if (event.code === 'Space') {
    event.preventDefault();
    togglePause();
  }
}, false);

// Resize: update canvas dimensions and re-render (no new animation loop)
window.addEventListener("resize", function () {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  renderBoard();
}, false);

// Zoom: adjust cell size and re-render (no new animation loop)
document.addEventListener("wheel", function (event) {
  cellSize += event.deltaY * -0.01;
  cellSize = Math.max(cellSize, 10);
  renderBoard();
}, false);
