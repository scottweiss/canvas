const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const width = window.innerWidth;
const height = window.innerHeight;
const maxWH = Math.max(width, height);
const cellSize = 50;


// Animation
var stop = true;
var frameCount = 0;
var fps, fpsInterval, startTime, now, then, elapsed;

let livingCells = new Set([
	"1,0",
	"2,1",
	"2,2",
	"1,2",
	"0,2"
]);

let nextGenerationLivingCells = new Set();

canvas.width = width;
canvas.height = height;

function initCGOL() {
	const columns = Math.ceil(canvas.width / cellSize);
	const rows = Math.ceil(canvas.height / cellSize);
	for (let i = 0; i < rows; i++) {
		for (let j = 0; j < columns; j++) {
			drawGridCell(i, j)
		}
	}
	for (let cell of livingCells) {
		initCell(cell)
	}
	startAnimating(5);
}

function drawGridCell(row, column) {
	const x = column * cellSize;
	const y = row * cellSize;
	ctx.fillStyle = `#000`;

	ctx.strokeRect(x, y, cellSize, cellSize);
}

function drawCell(row, column, dead) {
	const x = row * cellSize;
	const y = column * cellSize;
	ctx.strokeStyle = `#000`;
	ctx.fillStyle = dead ? `#fff` : `#000`;

	ctx.fillRect(x, y, cellSize, cellSize);
	ctx.strokeRect(x, y, cellSize, cellSize);
}

function initCell(cell) {
	livingCells.add(cell)
	drawCell(...decodeCell(cell));
}

function killCell(cell) {
	livingCells.delete(cell);
	drawCell(...decodeCell(cell), true);
}

function getLivingNeighborCount(x, y, alive) {
	let livingNeighborCount = 0;

	for (let x1 = x - 1; x1 <= x + 1; x1++) {
		for (let y1 = y - 1; y1 <= y + 1; y1++) {
			// dont count ourselves in the calculation!
			if (x1 === x && y1 === y) {
				continue;
			}
			if (livingCells && livingCells.has(encodeCell(x1, y1))) {
				livingNeighborCount++;
			} else if (!alive) {
				// Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
				const deadCellNeighborCount = getLivingNeighborCount(x1, y1, true);
				if (deadCellNeighborCount === 3) {
					nextGenerationLivingCells.add(encodeCell(x1, y1));
				}
				
			}
		}
	}

	return livingNeighborCount;
}

function shouldCellLive(cell, alive){
	const livingNeighborCount = getLivingNeighborCount(cell, alive);
	if (livingCells.has(cell)){
			// Any live cell with two or three live neighbours lives on to the next generation.
			if (livingNeighborCount === 2 || livingNeighborCount === 3){
					return true;
			}
	} else {
			// Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
			if (livingNeighborCount === 3){
					return true;
			}
	}

	// Any live cell with fewer than two live neighbours dies, as if by underpopulation.
	// Any live cell with more than three live neighbours dies, as if by overpopulation.
	return false;
}

function encodeCell(x, y) {
	return `${x},${y}`.trim();
}

function decodeCell(cellString) {
	return cellString.split(',').map(Number);
}

function toggleCell(cell) {
	if (livingCells.size && livingCells.has(cell)) {
		killCell(cell);
	} else {
		initCell(cell);
	}
}

function getCellFromClickEvent(event) {
	const x = Math.floor(event.clientX / cellSize);
	const y = Math.floor(event.clientY / cellSize);

	return encodeCell(x, y);
}



initCGOL();

function update() {
	// Any live cell with fewer than two live neighbours dies, as if by underpopulation.
	// Any live cell with two or three live neighbours lives on to the next generation.
	// Any live cell with more than three live neighbours dies, as if by overpopulation.
	livingCells.forEach((cell) => {
		const livingNeighborCount = getLivingNeighborCount(...decodeCell(cell));
		if (livingNeighborCount === 2 || livingNeighborCount === 3) {
			nextGenerationLivingCells.add(cell);
		}
	})

	if (livingCells && nextGenerationLivingCells) {
		livingCells.forEach((cell) => {
			killCell(cell);
		})
		nextGenerationLivingCells.forEach((cell) => {
			initCell(cell);
		})
	}

	livingCells = nextGenerationLivingCells;
	nextGenerationLivingCells = new Set();
}

// Animation
function startAnimating(fps) {
	fpsInterval = 1000 / fps;
	then = window.performance.now();
	startTime = then;
	animate();
}


function animate(newtime) {
	if (stop) {
		return;
	}

	requestAnimationFrame(animate);

	// calc elapsed time since last loop
	now = newtime;
	elapsed = now - then;

	// if enough time has elapsed, draw the next frame
	if (elapsed > fpsInterval) {

		// Get ready for next frame by setting then=now, but...
		// Also, adjust for fpsInterval not being multiple of 16.67
		then = now - (elapsed % fpsInterval);

		update();
	}
}


document.addEventListener("click", function (event) {
	toggleCell(getCellFromClickEvent(event))
}, false);

document.addEventListener("keypress", function (event) {
	if (event.code === 'Space') {
		stop = !stop;
		requestAnimationFrame(animate);
	}
}, false);
