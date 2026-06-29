import type { Server, Socket } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "@regenvormen/shared";
import {
  applyBust,
  applyClaim,
  applyPickValue,
  applyRoll,
  applySteal,
  claimableTile,
  currentSum,
  findStealTarget,
  isBust,
  isBustOnStop,
} from "@regenvormen/shared";
import {
  createRoom,
  getPlayerIdBySocket,
  getRoom,
  getState,
  joinRoom,
  registerSocket,
  removeSocket,
  setState,
  startGame,
} from "./rooms";

type IoServer = Server<ClientToServerEvents, ServerToClientEvents>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const TURN_TIMEOUT_MS = 30_000; // tijd die een afwezige speler krijgt voordat zijn beurt automatisch wordt afgebroken
const turnTimers = new Map<string, NodeJS.Timeout>();

function isPlayerConnected(roomCode: string, playerId: string): boolean {
  const room = getRoom(roomCode);
  if (!room) return false;
  return [...room.socketToPlayer.values()].includes(playerId);
}

function clearTurnTimer(roomCode: string): void {
  const timer = turnTimers.get(roomCode);
  if (timer) {
    clearTimeout(timer);
    turnTimers.delete(roomCode);
  }
}

// Breekt de beurt van een speler automatisch af als die speler geen verbonden socket meer heeft,
// zodat het spel niet vastloopt wanneer iemand wegvalt zonder terug te komen.
function scheduleTurnSkipIfDisconnected(io: IoServer, roomCode: string): void {
  clearTurnTimer(roomCode);
  const state = getState(roomCode);
  if (!state || state.phase !== "playing") return;
  const current = state.players[state.currentPlayerIndex];
  if (isPlayerConnected(roomCode, current.id)) return;

  const timer = setTimeout(() => {
    turnTimers.delete(roomCode);
    const latest = getState(roomCode);
    if (!latest || latest.phase !== "playing") return;
    const stillCurrent = latest.players[latest.currentPlayerIndex];
    if (stillCurrent.id !== current.id) return;
    if (isPlayerConnected(roomCode, stillCurrent.id)) return;

    setState(roomCode, applyBust(latest));
    broadcast(io, roomCode);
  }, TURN_TIMEOUT_MS);
  turnTimers.set(roomCode, timer);
}

function broadcast(io: IoServer, roomCode: string): void {
  const state = getState(roomCode);
  if (state) io.to(roomCode).emit("roomUpdated", { state });
  scheduleTurnSkipIfDisconnected(io, roomCode);
}

export function registerHandlers(io: IoServer, socket: IoSocket): void {
  socket.on("createRoom", ({ playerName }) => {
    if (!playerName?.trim()) {
      socket.emit("error", { message: "Naam is verplicht." });
      return;
    }
    const { roomCode, playerId } = createRoom(socket.id, playerName.trim());
    socket.join(roomCode);
    socket.emit("roomCreated", { roomCode, playerId });
    broadcast(io, roomCode);
  });

  socket.on("joinRoom", ({ roomCode, playerName }) => {
    const code = roomCode?.toUpperCase().trim();
    if (!code || !playerName?.trim()) {
      socket.emit("error", { message: "Room-code en naam zijn verplicht." });
      return;
    }
    const result = joinRoom(socket.id, code, playerName.trim());
    if (!result) {
      const state = getState(code);
      if (!state) {
        socket.emit("error", { message: "Room niet gevonden." });
      } else if (state.phase !== "lobby") {
        socket.emit("error", { message: "Spel al gestart." });
      } else if (state.players.length >= 7) {
        socket.emit("error", { message: "Room vol (max 7 spelers)." });
      } else {
        socket.emit("error", { message: "Naam al in gebruik in deze room." });
      }
      return;
    }
    socket.join(code);
    socket.emit("joinedRoom", { playerId: result.playerId });
    broadcast(io, code);
  });

  socket.on("rejoinRoom", ({ roomCode, playerId }) => {
    const code = roomCode?.toUpperCase().trim();
    const state = getState(code);
    if (!state) {
      socket.emit("error", { message: "Room niet gevonden." });
      return;
    }
    const playerExists = state.players.some((p) => p.id === playerId);
    if (!playerExists) {
      socket.emit("error", { message: "Speler niet gevonden in room." });
      return;
    }
    registerSocket(code, socket.id, playerId);
    socket.join(code);
    socket.emit("roomUpdated", { state });
    broadcast(io, code);
  });

  socket.on("startGame", () => {
    const ctx = getPlayerIdBySocket(socket.id);
    if (!ctx) return;
    const state = startGame(ctx.roomCode, ctx.playerId);
    if (!state) {
      socket.emit("error", { message: "Alleen de host kan het spel starten." });
      return;
    }
    broadcast(io, ctx.roomCode);
  });

  socket.on("rollDice", () => {
    const ctx = getPlayerIdBySocket(socket.id);
    if (!ctx) return;
    const state = getState(ctx.roomCode);
    if (!state || state.phase !== "playing") return;
    const current = state.players[state.currentPlayerIndex];
    if (current.id !== ctx.playerId) {
      socket.emit("error", { message: "Jij bent niet aan de beurt." });
      return;
    }
    if (state.turn.phase !== "rolling") {
      socket.emit("error", { message: "Nu kun je niet gooien." });
      return;
    }
    // Alle 8 stenen apart → beurt eindigt automatisch (kan niet meer gooien)
    if (state.turn.dicePool.length === 0) {
      socket.emit("error", { message: "Alle stenen zijn apart — stop of dat is een bust." });
      return;
    }

    const newTurn = applyRoll(state.turn);
    if (isBust(newTurn)) {
      setState(ctx.roomCode, applyBust({ ...state, turn: newTurn }, newTurn.lastRoll));
    } else {
      setState(ctx.roomCode, { ...state, turn: newTurn });
    }
    broadcast(io, ctx.roomCode);
  });

  socket.on("pickValue", ({ value }) => {
    const ctx = getPlayerIdBySocket(socket.id);
    if (!ctx) return;
    const state = getState(ctx.roomCode);
    if (!state || state.phase !== "playing") return;
    const current = state.players[state.currentPlayerIndex];
    if (current.id !== ctx.playerId) {
      socket.emit("error", { message: "Jij bent niet aan de beurt." });
      return;
    }
    if (state.turn.phase !== "picking") {
      socket.emit("error", { message: "Eerst gooien." });
      return;
    }

    const usedValues = state.turn.usedValues as import("@regenvormen/shared").DieFace[];
    if (usedValues.includes(value)) {
      socket.emit("error", { message: "Die waarde heb je al gekozen." });
      return;
    }
    if (!state.turn.lastRoll.some((d) => d.face === value)) {
      socket.emit("error", { message: "Die waarde zit niet in je worp." });
      return;
    }

    const newTurn = applyPickValue(state.turn, value);
    setState(ctx.roomCode, { ...state, turn: newTurn });
    broadcast(io, ctx.roomCode);
  });

  socket.on("stopAndClaim", () => {
    const ctx = getPlayerIdBySocket(socket.id);
    if (!ctx) return;
    const state = getState(ctx.roomCode);
    if (!state || state.phase !== "playing") return;
    const current = state.players[state.currentPlayerIndex];
    if (current.id !== ctx.playerId) {
      socket.emit("error", { message: "Jij bent niet aan de beurt." });
      return;
    }
    if (state.turn.phase !== "rolling") {
      socket.emit("error", { message: "Leg eerst stenen apart voordat je stopt." });
      return;
    }

    if (isBustOnStop(state.turn, state.tiles, state.players, current.id)) {
      setState(ctx.roomCode, applyBust(state));
    } else {
      const sum = currentSum(state.turn.setAside);
      const rowTile = claimableTile(sum, state.tiles);
      const stealTargetId = findStealTarget(sum, state.players, current.id);

      // Tegelwaarden zijn uniek: een exacte match in de rij en een stapel met diezelfde
      // bovenste waarde kunnen nooit allebei voorkomen, dus stelen heeft hier voorrang.
      if (stealTargetId) {
        setState(ctx.roomCode, applySteal(state, stealTargetId));
      } else {
        setState(ctx.roomCode, applyClaim(state, rowTile!));
      }
    }
    broadcast(io, ctx.roomCode);
  });

  socket.on("leaveRoom", () => {
    const ctx = getPlayerIdBySocket(socket.id);
    if (ctx) {
      socket.leave(ctx.roomCode);
      removeSocket(socket.id);
    }
  });

  socket.on("disconnect", () => {
    const ctx = getPlayerIdBySocket(socket.id);
    removeSocket(socket.id);
    if (ctx) {
      scheduleTurnSkipIfDisconnected(io, ctx.roomCode);
    }
  });
}
