/**
 * Shared Game of Life simulation module.
 * Used by both the UI (src/script.js) and the test suite (tests/simulation.test.mjs).
 */

// The eight surrounding neighbour offsets, excluding the cell itself.
const NEIGHBOR_OFFSETS = [];
for (let dx = -1; dx <= 1; dx++) {
  for (let dy = -1; dy <= 1; dy++) {
    if (dx !== 0 || dy !== 0) {
      NEIGHBOR_OFFSETS.push([dx, dy]);
    }
  }
}

/**
 * Encode a cell position to a string key.
 * @param {number} x
 * @param {number} y
 * @returns {string}
 */
export function encodeCell(x, y) {
  return `${x},${y}`;
}

/**
 * Decode a cell string to [x, y].
 * @param {string} cellString
 * @returns {number[]}
 */
export function decodeCell(cellString) {
  return cellString.split(',').map(Number);
}

/**
 * Create a Game of Life simulation instance.
 * Starts in a paused state.
 * @param {Set<string>} [initialCells] - Set of encoded cell strings.
 * @returns {object} Simulation API
 */
export function createSimulation(initialCells = new Set()) {
  let livingCells = new Set(initialCells);
  let isPaused = true;
  let generation = 0;

  function getLivingNeighborCount(x, y) {
    let count = 0;
    for (const [dx, dy] of NEIGHBOR_OFFSETS) {
      if (livingCells.has(encodeCell(x + dx, y + dy))) {
        count++;
      }
    }
    return count;
  }

  /**
   * Advance the simulation by one generation.
   * No-op when paused (paused stability).
   */
  function step() {
    if (isPaused) return;

    const next = new Set();
    const candidates = new Set();

    for (const cell of livingCells) {
      candidates.add(cell);
      const [x, y] = decodeCell(cell);
      for (const [dx, dy] of NEIGHBOR_OFFSETS) {
        candidates.add(encodeCell(x + dx, y + dy));
      }
    }

    for (const cell of candidates) {
      const [x, y] = decodeCell(cell);
      const neighbors = getLivingNeighborCount(x, y);
      const alive = livingCells.has(cell);
      if (alive && (neighbors === 2 || neighbors === 3)) {
        next.add(cell);
      } else if (!alive && neighbors === 3) {
        next.add(cell);
      }
    }

    livingCells = next;
    generation++;
  }

  /**
   * Toggle a cell's state (birth or death). Works regardless of pause state.
   * @param {string} cell
   */
  function toggleCell(cell) {
    if (livingCells.has(cell)) {
      livingCells.delete(cell);
    } else {
      livingCells.add(cell);
    }
  }

  /**
   * Check if a specific cell is alive.
   * @param {string} cell
   * @returns {boolean}
   */
  function isAlive(cell) {
    return livingCells.has(cell);
  }

  /**
   * Pause the simulation. Idempotent: calling when already paused is a no-op.
   */
  function pause() {
    isPaused = true;
  }

  /**
   * Resume the simulation. Idempotent: calling when already running is a no-op.
   */
  function resume() {
    isPaused = false;
  }

  /**
   * Toggle pause/resume state.
   */
  function togglePause() {
    isPaused = !isPaused;
  }

  /**
   * @returns {boolean} Whether the simulation is currently paused.
   */
  function isPausedState() {
    return isPaused;
  }

  /**
   * @returns {Set<string>} A copy of the current living cells.
   */
  function getLivingCells() {
    return new Set(livingCells);
  }

  /**
   * @returns {number} The current generation count.
   */
  function getGeneration() {
    return generation;
  }

  /**
   * @returns {string} The button label: "Resume" when paused, "Pause" when running.
   */
  function getLabel() {
    return isPaused ? "Resume" : "Pause";
  }

  return {
    step,
    toggleCell,
    isAlive,
    pause,
    resume,
    togglePause,
    isPausedState,
    getLivingCells,
    getGeneration,
    getLabel,
  };
}
