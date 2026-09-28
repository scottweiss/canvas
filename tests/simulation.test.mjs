import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createSimulation, encodeCell, decodeCell } from "../src/simulation.mjs";

describe("encodeCell / decodeCell", () => {
  it("encodes a cell position to a string", () => {
    assert.equal(encodeCell(3, 7), "3,7");
    assert.equal(encodeCell(0, 0), "0,0");
  });

  it("decodes a cell string to coordinates", () => {
    assert.deepEqual(decodeCell("3,7"), [3, 7]);
    assert.deepEqual(decodeCell("0,0"), [0, 0]);
  });

  it("round-trips encode/decode", () => {
    const encoded = encodeCell(5, 12);
    assert.deepEqual(decodeCell(encoded), [5, 12]);
  });
});

describe("createSimulation - initial state", () => {
  it("starts paused by default", () => {
    const sim = createSimulation();
    assert.equal(sim.isPausedState(), true);
    assert.equal(sim.getLabel(), "Resume");
  });

  it("accepts initial cells", () => {
    const sim = createSimulation(new Set(["0,0", "1,0", "2,0"]));
    assert.equal(sim.getLivingCells().size, 3);
    assert.ok(sim.isAlive("0,0"));
    assert.ok(sim.isAlive("1,0"));
    assert.ok(sim.isAlive("2,0"));
  });
});

describe("paused stability", () => {
  it("step() is a no-op when paused", () => {
    const sim = createSimulation(new Set(["1,0", "2,0", "3,0"]));
    // Starts paused
    const before = sim.getLivingCells();
    sim.step();
    sim.step();
    sim.step();
    const after = sim.getLivingCells();
    assert.deepEqual(after, before);
    assert.equal(sim.getGeneration(), 0);
  });

  it("board is unchanged across multiple paused steps", () => {
    const cells = new Set(["0,1", "1,1", "2,1", "1,2"]);
    const sim = createSimulation(cells);
    for (let i = 0; i < 10; i++) {
      sim.step();
    }
    assert.deepEqual(sim.getLivingCells(), cells);
    assert.equal(sim.getGeneration(), 0);
  });
});

describe("known oscillator (blinker)", () => {
  it("horizontal blinker becomes vertical after one step", () => {
    const sim = createSimulation(new Set([
      encodeCell(1, 0),
      encodeCell(2, 0),
      encodeCell(3, 0),
    ]));
    sim.resume();
    sim.step();
    const gen1 = sim.getLivingCells();
    assert.deepEqual(
      [...gen1].sort(),
      [encodeCell(2, -1), encodeCell(2, 0), encodeCell(2, 1)].sort()
    );
  });

  it("vertical blinker returns to horizontal after second step (period 2)", () => {
    const sim = createSimulation(new Set([
      encodeCell(1, 0),
      encodeCell(2, 0),
      encodeCell(3, 0),
    ]));
    sim.resume();
    sim.step(); // gen 1: vertical
    sim.step(); // gen 2: back to horizontal
    const gen2 = sim.getLivingCells();
    assert.deepEqual(
      [...gen2].sort(),
      [encodeCell(1, 0), encodeCell(2, 0), encodeCell(3, 0)].sort()
    );
    assert.equal(sim.getGeneration(), 2);
  });

  it("blinker maintains period-2 oscillation over multiple steps", () => {
    const horizontal = new Set([
      encodeCell(1, 0),
      encodeCell(2, 0),
      encodeCell(3, 0),
    ]);
    const vertical = new Set([
      encodeCell(2, -1),
      encodeCell(2, 0),
      encodeCell(2, 1),
    ]);
    const sim = createSimulation(horizontal);
    sim.resume();

    for (let i = 0; i < 6; i++) {
      sim.step();
      // After step 1 (i=0), the horizontal blinker becomes vertical.
      // After step 2 (i=1), it returns to horizontal. And so on.
      const expected = i % 2 === 0 ? vertical : horizontal;
      assert.deepEqual(
        [...sim.getLivingCells()].sort(),
        [...expected].sort(),
        `Generation ${i + 1} should be ${i % 2 === 0 ? "vertical" : "horizontal"}`
      );
    }
  });
});

describe("edits across resume", () => {
  it("cells toggled while paused are present after resume", () => {
    const sim = createSimulation(new Set(["0,0", "1,0"]));
    // Add a cell while paused
    sim.toggleCell("2,0");
    assert.ok(sim.isAlive("2,0"));
    // Remove a cell while paused
    sim.toggleCell("0,0");
    assert.ok(!sim.isAlive("0,0"));

    // Resume and step
    sim.resume();
    sim.step();

    // After the step, the board should have evolved from the edited state {1,0}, {2,0}
    // Two adjacent cells: each has 1 neighbor → both die (underpopulation)
    // No dead cell has 3 neighbors → no births
    // Result: empty
    assert.equal(sim.getLivingCells().size, 0);
  });

  it("edits made while paused affect subsequent oscillation", () => {
    // Start with a horizontal blinker
    const sim = createSimulation(new Set([
      encodeCell(1, 0),
      encodeCell(2, 0),
      encodeCell(3, 0),
    ]));
    // While paused, add a cell at (5, 5) - isolated, will die
    sim.toggleCell(encodeCell(5, 5));
    assert.ok(sim.isAlive(encodeCell(5, 5)));

    // Resume
    sim.resume();
    sim.step();

    // The blinker should still be oscillating; the isolated cell dies
    const cells = sim.getLivingCells();
    assert.ok(!cells.has(encodeCell(5, 5)), "Isolated cell should die");
    // Blinker should now be vertical
    assert.ok(cells.has(encodeCell(2, 0)), "Center of blinker survives");
  });
});

describe("idempotent state changes", () => {
  it("pause() is idempotent when already paused", () => {
    const sim = createSimulation(new Set(["1,1"]));
    // Already paused
    assert.equal(sim.isPausedState(), true);
    sim.pause();
    assert.equal(sim.isPausedState(), true);
    sim.pause();
    assert.equal(sim.isPausedState(), true);
    assert.equal(sim.getLabel(), "Resume");
  });

  it("resume() is idempotent when already running", () => {
    const sim = createSimulation(new Set(["1,1"]));
    sim.resume();
    assert.equal(sim.isPausedState(), false);
    sim.resume();
    assert.equal(sim.isPausedState(), false);
    sim.resume();
    assert.equal(sim.isPausedState(), false);
    assert.equal(sim.getLabel(), "Pause");
  });

  it("togglePause() alternates state", () => {
    const sim = createSimulation();
    assert.equal(sim.isPausedState(), true);
    sim.togglePause();
    assert.equal(sim.isPausedState(), false);
    assert.equal(sim.getLabel(), "Pause");
    sim.togglePause();
    assert.equal(sim.isPausedState(), true);
    assert.equal(sim.getLabel(), "Resume");
    sim.togglePause();
    assert.equal(sim.isPausedState(), false);
    assert.equal(sim.getLabel(), "Pause");
  });

  it("pause preserves generation count and board state", () => {
    const sim = createSimulation(new Set([
      encodeCell(1, 0), encodeCell(2, 0), encodeCell(3, 0),
    ]));
    sim.resume();
    sim.step();
    const genAfterStep = sim.getGeneration();
    const cellsAfterStep = sim.getLivingCells();

    sim.pause();
    assert.equal(sim.getGeneration(), genAfterStep);
    assert.deepEqual(sim.getLivingCells(), cellsAfterStep);
    assert.equal(sim.getLabel(), "Resume");
  });
});

describe("getLivingCells returns a copy", () => {
  it("modifying the returned set does not affect the simulation", () => {
    const sim = createSimulation(new Set(["0,0", "1,0"]));
    const copy = sim.getLivingCells();
    copy.add("99,99");
    assert.ok(!sim.isAlive("99,99"));
    assert.equal(sim.getLivingCells().size, 2);
  });
});
