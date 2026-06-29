import type { GameState, Player } from "@regenvormen/shared";
import { initGameState, initialTurnState } from "@regenvormen/shared";

interface Room {
  state: GameState;
  socketToPlayer: Map<string, string>; // socketId → playerId
  emptyAt: number | null; // tijdstip waarop de laatste socket de room verliet, null als iemand verbonden is
}

const rooms = new Map<string, Room>();
const ROOM_TTL_MS = 10 * 60 * 1000; // ruim de room op als hij dit lang zonder verbonden speler is

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code: string;
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  } while (rooms.has(code));
  return code;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function createRoom(socketId: string, playerName: string): { roomCode: string; playerId: string } {
  const code = generateCode();
  const playerId = generateId();
  const player: Player = { id: playerId, name: playerName, tiles: [] };
  const state: GameState = {
    roomCode: code,
    hostId: playerId,
    phase: "lobby",
    players: [player],
    currentPlayerIndex: 0,
    tiles: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
    closedTiles: [],
    turn: initialTurnState(),
    winner: null,
    lastEvent: null,
  };
  const socketToPlayer = new Map([[socketId, playerId]]);
  rooms.set(code, { state, socketToPlayer, emptyAt: null });
  return { roomCode: code, playerId };
}

export function joinRoom(
  socketId: string,
  roomCode: string,
  playerName: string
): { playerId: string; state: GameState } | null {
  const room = rooms.get(roomCode);
  if (!room) return null;
  if (room.state.phase !== "lobby") return null;
  if (room.state.players.length >= 7) return null;
  // Controleer of dezelfde naam al in room zit (ongeacht hoofd-/kleine letters)
  if (room.state.players.some((p) => p.name.toLowerCase() === playerName.toLowerCase())) return null;

  const playerId = generateId();
  const player: Player = { id: playerId, name: playerName, tiles: [] };
  room.state.players.push(player);
  room.socketToPlayer.set(socketId, playerId);
  room.emptyAt = null;
  return { playerId, state: room.state };
}

export function startGame(roomCode: string, playerId: string): GameState | null {
  const room = rooms.get(roomCode);
  if (!room) return null;
  if (room.state.hostId !== playerId) return null;
  if (room.state.phase !== "lobby") return null;
  if (room.state.players.length < 1) return null;

  room.state = initGameState(roomCode, playerId, room.state.players);
  return room.state;
}

export function getRoom(roomCode: string): Room | undefined {
  return rooms.get(roomCode);
}

export function getState(roomCode: string): GameState | null {
  return rooms.get(roomCode)?.state ?? null;
}

export function setState(roomCode: string, state: GameState): void {
  const room = rooms.get(roomCode);
  if (room) room.state = state;
}

export function registerSocket(roomCode: string, socketId: string, playerId: string): void {
  const room = rooms.get(roomCode);
  if (room) {
    room.socketToPlayer.set(socketId, playerId);
    room.emptyAt = null;
  }
}

export function getPlayerIdBySocket(socketId: string): { playerId: string; roomCode: string } | null {
  for (const [code, room] of rooms.entries()) {
    const playerId = room.socketToPlayer.get(socketId);
    if (playerId) return { playerId, roomCode: code };
  }
  return null;
}

export function removeSocket(socketId: string): void {
  for (const [, room] of rooms.entries()) {
    if (room.socketToPlayer.delete(socketId) && room.socketToPlayer.size === 0) {
      room.emptyAt = Date.now();
    }
  }
}

// Verwijdert rooms die al langer dan ROOM_TTL_MS geen enkele verbonden speler meer hebben.
export function pruneEmptyRooms(): void {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (room.emptyAt !== null && now - room.emptyAt > ROOM_TTL_MS) {
      rooms.delete(code);
    }
  }
}
