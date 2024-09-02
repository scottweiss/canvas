const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const width = window.innerWidth;
const height = window.innerHeight;
const maxWH = Math.max(width, height);
const cellSize = 50;

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

function drawGridLines() {
	const columns = Math.ceil(canvas.width / cellSize);
	const rows = Math.ceil(canvas.height / cellSize);
	for (let i = 0; i < rows; i++) {
		for (let j = 0; j < columns; j++) {
			drawGridCell(i, j)
		}
	}
	for (let cell of livingCells) {
		initCell(...decodeCell(cell))
	}
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

function initCell(x, y) {
    livingCells.add(encodeCell(x, y))
    drawCell(x, y);
}

function killCell(x, y) {
    livingCells.delete(encodeCell(x, y));
    drawCell(x, y, true);
}

function getLivingNeighborCount(x, y, stop) {
    let livingNeighborCount = 0;

    for (let x1 = x - 1; x1 <= x + 1; x1++) {
        for (let y1 = y - 1; y1 <= y + 1; y1++) {
            // dont count ourselves in the calculation!
            if (x1 === x && y1 === y) {
                continue;
            }
            if (livingCells && livingCells.has(encodeCell(x1, y1))) {
                livingNeighborCount++;
            } else if (!stop) {
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

function encodeCell(x, y) {
    return `${x},${y}`;
}

function decodeCell(cellString) {
    return cellString.split(',').map(Number);
}

function toggleCell(x, y) {
    if (livingCells.size && livingCells.has(encodeCell(x, y))) {
        killCell(x, y);
    } else {
        initCell(x, y);
    }
}

function getCellFromClickEvent(event) {
    const x = Math.floor(event.clientX / cellSize);
    const y = Math.floor(event.clientY / cellSize);

    return [x, y];
}

function drawCellFromClick(event) {
    toggleCell(...getCellFromClickEvent(event))
}

drawGridLines();

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
            killCell(...decodeCell(cell));
        })
        nextGenerationLivingCells.forEach((cell) => {
            initCell(...decodeCell(cell));
        })
    }

    livingCells = nextGenerationLivingCells;
    nextGenerationLivingCells = new Set();
}

document.addEventListener("click", function (event) {
    drawCellFromClick(event);
}, false);

document.addEventListener("keypress", function (event) {
    if (event.code === 'Space') {
        update();
    }
}, false);
