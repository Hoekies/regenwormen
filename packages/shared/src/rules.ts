import type { Die, DieFace, GameState, Player, TurnState } from "./types";

const ALL_TILES = [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36];
let _eventId = 0;
const nextEventId = () => ++_eventId;

export function wormsOnTile(tile: number): number {
  if (tile <= 24) return 1;
  if (tile <= 28) return 2;
  if (tile <= 32) return 3;
  return 4;
}

export function scoreWorms(player: Player): number {
  return player.tiles.reduce((sum, t) => sum + wormsOnTile(t), 0);
}

export function faceValue(face: DieFace): number {
  return face === "W" ? 5 : face;
}

export function rollDice(count: number): Die[] {
  const faces: DieFace[] = [1, 2, 3, 4, 5, "W"];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    face: faces[Math.floor(Math.random() * 6)],
  }));
}

export function currentSum(setAside: Die[]): number {
  return setAside.reduce((sum, d) => sum + faceValue(d.face), 0);
}

export function hasWorm(setAside: Die[]): boolean {
  return setAside.some((d) => d.face === "W");
}

export function availablePicks(lastRoll: Die[], usedValues: DieFace[]): DieFace[] {
  const rolledFaces = new Set(lastRoll.map((d) => d.face));
  return [...rolledFaces].filter((f) => !usedValues.includes(f));
}

// Geeft beschikbare rij-tegel terug: exact match eerst, anders hoogste ≤ som.
export function claimableTile(sum: number, tiles: number[]): number | null {
  if (tiles.length === 0) return null;
  const sorted = [...tiles].sort((a, b) => a - b);
  if (sorted.includes(sum)) return sum;
  const below = sorted.filter((t) => t <= sum);
  return below.length > 0 ? below[below.length - 1] : null;
}

// Geeft de speler-id terug van wie gestolen kan worden (bovenste tegel = som).
// Stelen is alleen mogelijk bij exact match.
export function findStealTarget(sum: number, players: Player[], currentPlayerId: string): string | null {
  for (const p of players) {
    if (p.id === currentPlayerId) continue;
    if (p.tiles.length > 0 && p.tiles[0] === sum) return p.id;
  }
  return null;
}

export function isBust(turn: TurnState, tiles: number[]): boolean {
  return availablePicks(turn.lastRoll, turn.usedValues as DieFace[]).length === 0;
}

export function isBustOnStop(turn: TurnState, tiles: number[], players?: Player[], currentPlayerId?: string): boolean {
  if (!hasWorm(turn.setAside)) return true;
  const sum = currentSum(turn.setAside);
  if (claimableTile(sum, tiles) !== null) return false;
  if (players && currentPlayerId && findStealTarget(sum, players, currentPlayerId) !== null) return false;
  return true;
}

export function initialTurnState(): TurnState {
  return {
    phase: "rolling",
    dicePool: rollDice(8),
    setAside: [],
    usedValues: [],
    lastRoll: [],
  };
}

export function applyPickValue(turn: TurnState, value: DieFace): TurnState {
  const picked = turn.lastRoll.filter((d) => d.face === value);
  const remaining = turn.lastRoll.filter((d) => d.face !== value);
  return {
    ...turn,
    phase: "rolling",
    dicePool: remaining,
    setAside: [...turn.setAside, ...picked],
    usedValues: [...(turn.usedValues as DieFace[]), value],
    lastRoll: [],
  };
}

export function applyRoll(turn: TurnState): TurnState {
  const rolled = rollDice(turn.dicePool.length);
  return {
    ...turn,
    phase: "picking",
    lastRoll: rolled,
  };
}

export function initGameState(roomCode: string, hostId: string, players: Player[]): GameState {
  return {
    roomCode,
    hostId,
    phase: "playing",
    players,
    currentPlayerIndex: 0,
    tiles: [...ALL_TILES],
    closedTiles: [],
    turn: initialTurnState(),
    winner: null,
    lastEvent: null,
  };
}

export function applyBust(state: GameState, bustDice: Die[] = []): GameState {
  const players = state.players.map((p) => ({ ...p, tiles: [...p.tiles] }));
  const current = players[state.currentPlayerIndex];
  let newTiles = [...state.tiles];
  let closedTiles = [...state.closedTiles];

  if (current.tiles.length > 0) {
    const returned = current.tiles[0];
    current.tiles = current.tiles.slice(1);
    newTiles = [...newTiles, returned].sort((a, b) => a - b);

    // Officieel: alleen hoogste sluiten als de teruggelegde tegel NIET de hoogste is
    const highest = newTiles[newTiles.length - 1];
    if (highest !== returned) {
      newTiles = newTiles.slice(0, -1);
      closedTiles = [...closedTiles, highest];
    }
    // Als returned === highest: tegel blijft open, niets sluiten
  } else {
    // Geen eigen tegel om terug te leggen: sluit hoogste open tegel
    if (newTiles.length > 0) {
      const highest = newTiles[newTiles.length - 1];
      newTiles = newTiles.slice(0, -1);
      closedTiles = [...closedTiles, highest];
    }
  }

  const next = nextPlayerIndex(state);
  const bustPlayer = state.players[state.currentPlayerIndex];
  return {
    ...state,
    players,
    tiles: newTiles,
    closedTiles,
    currentPlayerIndex: next,
    turn: initialTurnState(),
    phase: newTiles.length === 0 ? "finished" : "playing",
    winner: newTiles.length === 0 ? determineWinner(players) : null,
    lastEvent: {
      id: nextEventId(),
      type: "bust",
      playerName: bustPlayer.name,
      returnedTile: bustPlayer.tiles.length > 0 ? bustPlayer.tiles[0] : null,
      closedTile: closedTiles.length > state.closedTiles.length
        ? closedTiles[closedTiles.length - 1]
        : null,
      bustDice,
    },
  };
}

export function applyClaim(state: GameState, tile: number): GameState {
  const players = state.players.map((p) => ({ ...p, tiles: [...p.tiles] }));
  const current = players[state.currentPlayerIndex];
  current.tiles = [tile, ...current.tiles];

  const newTiles = state.tiles.filter((t) => t !== tile);
  const next = nextPlayerIndex(state);

  return {
    ...state,
    players,
    tiles: newTiles,
    currentPlayerIndex: next,
    turn: initialTurnState(),
    phase: newTiles.length === 0 ? "finished" : "playing",
    winner: newTiles.length === 0 ? determineWinner(players) : null,
    lastEvent: { id: nextEventId(), type: "claim", playerName: state.players[state.currentPlayerIndex].name, tile },
  };
}

// Steel bovenste tegel van doelspeler.
export function applySteal(state: GameState, targetPlayerId: string): GameState {
  const players = state.players.map((p) => ({ ...p, tiles: [...p.tiles] }));
  const current = players[state.currentPlayerIndex];
  const target = players.find((p) => p.id === targetPlayerId)!;

  const stolen = target.tiles[0];
  target.tiles = target.tiles.slice(1);
  current.tiles = [stolen, ...current.tiles];

  const next = nextPlayerIndex(state);
  const fromPlayer = state.players.find((p) => p.id === targetPlayerId)!;
  return {
    ...state,
    players,
    currentPlayerIndex: next,
    turn: initialTurnState(),
    lastEvent: {
      id: nextEventId(),
      type: "steal",
      playerName: state.players[state.currentPlayerIndex].name,
      fromPlayerName: fromPlayer.name,
      tile: stolen,
    },
  };
}

function nextPlayerIndex(state: GameState): number {
  return (state.currentPlayerIndex + 1) % state.players.length;
}

function determineWinner(players: Player[]): string {
  let best = -1;
  let bestTile = -1;
  let winnerId = players[0].id;
  for (const p of players) {
    const w = scoreWorms(p);
    const top = p.tiles.length > 0 ? p.tiles[0] : -1;
    if (w > best || (w === best && top > bestTile)) {
      best = w;
      bestTile = top;
      winnerId = p.id;
    }
  }
  return winnerId;
}

export { ALL_TILES };
