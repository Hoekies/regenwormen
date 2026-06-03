import { describe, expect, it } from "vitest";
import {
  applyBust,
  applyClaim,
  applyPickValue,
  applyRoll,
  applySteal,
  availablePicks,
  claimableTile,
  currentSum,
  faceValue,
  findStealTarget,
  hasWorm,
  initGameState,
  isBust,
  isBustOnStop,
  scoreWorms,
  wormsOnTile,
} from "./rules";
import type { Die, Player, TurnState } from "./types";

function makeTurn(overrides: Partial<TurnState> = {}): TurnState {
  return {
    phase: "picking",
    dicePool: [],
    setAside: [],
    usedValues: [],
    lastRoll: [],
    ...overrides,
  };
}

function makePlayer(id: string, tiles: number[] = []): Player {
  return { id, name: id, tiles };
}

describe("wormsOnTile", () => {
  it.each([
    [21, 1], [24, 1],
    [25, 2], [28, 2],
    [29, 3], [32, 3],
    [33, 4], [36, 4],
  ])("tegel %i = %i wormen", (tile, expected) => {
    expect(wormsOnTile(tile)).toBe(expected);
  });
});

describe("faceValue", () => {
  it("W telt als 5", () => expect(faceValue("W")).toBe(5));
  it("cijfer = zichzelf", () => expect(faceValue(3)).toBe(3));
});

describe("currentSum", () => {
  it("telt correct", () => {
    const dice: Die[] = [
      { id: 0, face: 3 },
      { id: 1, face: "W" },
      { id: 2, face: 2 },
    ];
    expect(currentSum(dice)).toBe(10);
  });
  it("lege setAside = 0", () => expect(currentSum([])).toBe(0));
});

describe("hasWorm", () => {
  it("true als worm aanwezig", () => {
    expect(hasWorm([{ id: 0, face: "W" }])).toBe(true);
  });
  it("false zonder worm", () => {
    expect(hasWorm([{ id: 0, face: 3 }])).toBe(false);
  });
});

describe("availablePicks", () => {
  it("filtert al-gebruikte waarden", () => {
    const roll: Die[] = [{ id: 0, face: 3 }, { id: 1, face: "W" }];
    expect(availablePicks(roll, ["W"])).toEqual([3]);
  });
  it("geeft lege array als alles gebruikt", () => {
    const roll: Die[] = [{ id: 0, face: 3 }];
    expect(availablePicks(roll, [3])).toEqual([]);
  });
});

describe("claimableTile", () => {
  const tiles = [21, 22, 23, 25, 30, 36];
  it("exact match heeft voorrang", () => expect(claimableTile(25, tiles)).toBe(25));
  it("hoogste onder som als geen exact", () => expect(claimableTile(24, tiles)).toBe(23));
  it("niets als lager dan laagste", () => expect(claimableTile(20, tiles)).toBeNull());
  it("lege midden = null", () => expect(claimableTile(30, [])).toBeNull());
});

describe("isBust (tijdens dobbelbeurt)", () => {
  it("bust als geen nieuwe waarde beschikbaar", () => {
    const turn = makeTurn({ lastRoll: [{ id: 0, face: 3 }], usedValues: [3] });
    expect(isBust(turn, [21])).toBe(true);
  });
  it("niet bust als nieuwe waarde beschikbaar", () => {
    const turn = makeTurn({ lastRoll: [{ id: 0, face: 3 }, { id: 1, face: "W" }], usedValues: [3] });
    expect(isBust(turn, [21])).toBe(false);
  });
});

describe("isBustOnStop", () => {
  it("bust zonder worm", () => {
    const turn = makeTurn({ setAside: [{ id: 0, face: 3 }] });
    expect(isBustOnStop(turn, [21])).toBe(true);
  });
  it("bust als som te laag", () => {
    const turn = makeTurn({ setAside: [{ id: 0, face: "W" }] }); // som = 5
    expect(isBustOnStop(turn, [21])).toBe(true); // 5 < 21
  });
  it("geldig stoppen", () => {
    const setAside: Die[] = [
      { id: 0, face: "W" },
      ...Array.from({ length: 4 }, (_, i) => ({ id: i + 1, face: 5 as const })),
    ]; // som = 5 + 20 = 25
    const turn = makeTurn({ setAside });
    expect(isBustOnStop(turn, [25])).toBe(false);
  });
});

describe("scoreWorms", () => {
  it("telt wormen op alle tegels", () => {
    const p = makePlayer("a", [21, 28, 33]); // 1 + 2 + 4 = 7
    expect(scoreWorms(p)).toBe(7);
  });
  it("geen tegels = 0", () => expect(scoreWorms(makePlayer("a"))).toBe(0));
});

describe("applyPickValue", () => {
  it("legt alle stenen van gekozen waarde apart", () => {
    const roll: Die[] = [
      { id: 0, face: 3 },
      { id: 1, face: 3 },
      { id: 2, face: "W" },
    ];
    const turn = makeTurn({ dicePool: [roll[2]], lastRoll: [roll[0], roll[1]], usedValues: [] });
    const next = applyPickValue(turn, 3);
    expect(next.setAside).toHaveLength(2);
    expect(next.usedValues).toContain(3);
  });
});

describe("applyBust", () => {
  it("geeft bovenste eigen tegel terug en sluit hoogste midden-tegel", () => {
    const players = [makePlayer("a", [25]), makePlayer("b", [])];
    const state = initGameState("TEST", "a", players);
    const busted = applyBust({ ...state, tiles: [21, 22, 23, 36] });
    expect(busted.tiles).toContain(25);
    expect(busted.closedTiles).toContain(36);
    expect(busted.players[0].tiles).toHaveLength(0);
  });

  it("teruggelegde tegel is hoogste → geen tegel sluiten", () => {
    const players = [makePlayer("a", [36]), makePlayer("b", [])];
    const state = initGameState("TEST", "a", players);
    const busted = applyBust({ ...state, tiles: [21, 22] });
    // 36 terug in midden → 36 is hoogste → niet sluiten
    expect(busted.tiles).toContain(36);
    expect(busted.closedTiles).toHaveLength(0);
  });

  it("geen eigen tegel → sluit hoogste midden-tegel", () => {
    const players = [makePlayer("a", []), makePlayer("b", [])];
    const state = initGameState("TEST", "a", players);
    const busted = applyBust({ ...state, tiles: [21, 36] });
    expect(busted.closedTiles).toContain(36);
    expect(busted.tiles).not.toContain(36);
  });
});

describe("findStealTarget + applySteal", () => {
  it("vindt tegenstander met exacte bovenste tegel", () => {
    const players = [makePlayer("a"), makePlayer("b", [25, 30])];
    expect(findStealTarget(25, players, "a")).toBe("b");
  });

  it("geeft null als geen match", () => {
    const players = [makePlayer("a"), makePlayer("b", [30])];
    expect(findStealTarget(25, players, "a")).toBeNull();
  });

  it("steelt bovenste tegel van tegenstander", () => {
    const players = [makePlayer("a"), makePlayer("b", [25, 30])];
    const state = { ...initGameState("TEST", "a", players), tiles: [] };
    const stolen = applySteal(state, "b");
    expect(stolen.players[0].tiles).toContain(25);
    expect(stolen.players[1].tiles).not.toContain(25);
    expect(stolen.players[1].tiles).toContain(30);
  });
});

describe("applyClaim", () => {
  it("voegt tegel toe aan speler en verwijdert uit midden", () => {
    const players = [makePlayer("a"), makePlayer("b")];
    const state = { ...initGameState("TEST", "a", players), tiles: [25, 30] };
    const claimed = applyClaim(state, 25);
    expect(claimed.players[0].tiles).toContain(25);
    expect(claimed.tiles).not.toContain(25);
  });
});
