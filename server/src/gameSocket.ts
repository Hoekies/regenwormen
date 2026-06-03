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
  getState,
  joinRoom,
  removeSocket,
  setState,
  startGame,
} from "./rooms";

type IoServer = Server<ClientToServerEvents, ServerToClientEvents>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

function broadcast(io: IoServer, roomCode: string): void {
  const state = getState(roomCode);
  if (state) io.to(roomCode).emit("roomUpdated", { state });
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
      socket.emit("error", { message: "Room niet gevonden of spel al gestart." });
      return;
    }
    socket.join(code);
    socket.emit("joinedRoom", { playerId: result.playerId });
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
    if (isBust(newTurn, state.tiles)) {
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

      if (rowTile === sum) {
        // Exacte match in de rij: pak uit de rij (regel: rij heeft voorrang)
        setState(ctx.roomCode, applyClaim(state, rowTile));
      } else if (stealTargetId) {
        // Alleen exacte match bij tegenstander → stelen
        setState(ctx.roomCode, applySteal(state, stealTargetId));
      } else {
        // Hoogste rij-tegel ≤ som
        setState(ctx.roomCode, applyClaim(state, rowTile!));
      }
    }
    broadcast(io, ctx.roomCode);
  });

  socket.on("disconnect", () => {
    removeSocket(socket.id);
  });
}
