import { useEffect, useReducer } from "react";
import type { GameState } from "@regenvormen/shared";
import socket from "./socket";
import Lobby from "./views/Lobby";
import GameTable from "./views/GameTable";
import Finished from "./views/Finished";

interface AppState {
  screen: "home" | "lobby" | "game" | "finished";
  roomCode: string;
  playerId: string;
  gameState: GameState | null;
  error: string;
}

type Action =
  | { type: "ROOM_CREATED"; roomCode: string; playerId: string }
  | { type: "JOINED_ROOM"; playerId: string }
  | { type: "GAME_UPDATED"; state: GameState }
  | { type: "ERROR"; message: string }
  | { type: "CLEAR_ERROR" };

function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case "ROOM_CREATED":
      return { ...s, screen: "lobby", roomCode: a.roomCode, playerId: a.playerId, error: "" };
    case "JOINED_ROOM":
      return { ...s, screen: "lobby", playerId: a.playerId, error: "" };
    case "GAME_UPDATED": {
      const screen =
        a.state.phase === "finished" ? "finished" :
        a.state.phase === "playing"  ? "game" : "lobby";
      return { ...s, screen, gameState: a.state, error: "" };
    }
    case "ERROR":
      return { ...s, error: a.message };
    case "CLEAR_ERROR":
      return { ...s, error: "" };
    default:
      return s;
  }
}

const init: AppState = {
  screen: "home",
  roomCode: "",
  playerId: "",
  gameState: null,
  error: "",
};

export default function App() {
  const [state, dispatch] = useReducer(reducer, init);
  useEffect(() => {
    socket.connect();

    socket.on("roomCreated", ({ roomCode, playerId }) => {
      dispatch({ type: "ROOM_CREATED", roomCode, playerId });
    });
    socket.on("joinedRoom", ({ playerId }) => {
      dispatch({ type: "JOINED_ROOM", playerId });
    });
    socket.on("roomUpdated", ({ state: gs }) => {
      dispatch({ type: "GAME_UPDATED", state: gs });
    });
    socket.on("error", ({ message }) => {
      dispatch({ type: "ERROR", message });
    });

    return () => {
      socket.off("roomCreated");
      socket.off("joinedRoom");
      socket.off("roomUpdated");
      socket.off("error");
      socket.disconnect();
    };
  }, []);

  const clearError = () => dispatch({ type: "CLEAR_ERROR" });

  if (state.screen === "home" || state.screen === "lobby") {
    return (
      <Lobby
        screen={state.screen}
        roomCode={state.roomCode}
        playerId={state.playerId}
        gameState={state.gameState}
        error={state.error}
        onClearError={clearError}
      />
    );
  }
  if (state.screen === "game" && state.gameState) {
    return (
      <GameTable
        gameState={state.gameState}
        playerId={state.playerId}
        error={state.error}
        onClearError={clearError}
      />
    );
  }
  if (state.screen === "finished" && state.gameState) {
    return <Finished gameState={state.gameState} playerId={state.playerId} />;
  }
  // Lege state: lobby laadt nog
  return (
    <Lobby screen="home" roomCode="" playerId="" gameState={null} error="" onClearError={() => {}} />
  );
}
