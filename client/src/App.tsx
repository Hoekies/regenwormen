import { useEffect, useReducer } from "react";
import { useIntroAudio } from "./hooks/useIntroAudio";
import type { GameState } from "@regenvormen/shared";
import socket from "./socket";
import Lobby from "./views/Lobby";
import GameTable from "./views/GameTable";
import Finished from "./views/Finished";
import Footer from "./components/Footer";

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
  | { type: "CLEAR_ERROR" }
  | { type: "DISCONNECT"; message: string };

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
    case "DISCONNECT":
      return { ...s, screen: "home", error: a.message };
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

  // Intro music: play on home/lobby, stop on game/finished
  useIntroAudio(state.screen === "home" || state.screen === "lobby");

  // Bij mount: localStorage checken voor auto-rejoin
  useEffect(() => {
    const saved = localStorage.getItem("regenwormen-session");
    if (saved) {
      const { roomCode, playerId } = JSON.parse(saved);
      dispatch({ type: "JOINED_ROOM", playerId });
      // Ik stuur meteen rejoin
      setTimeout(() => {
        socket.emit("rejoinRoom", { roomCode, playerId });
      }, 100);
    }
  }, []);

  useEffect(() => {
    socket.connect();

    socket.on("roomCreated", ({ roomCode, playerId }) => {
      localStorage.setItem("regenwormen-session", JSON.stringify({ roomCode, playerId }));
      dispatch({ type: "ROOM_CREATED", roomCode, playerId });
    });
    socket.on("joinedRoom", ({ playerId }) => {
      const roomCode = state.roomCode || localStorage.getItem("regenwormen-session")?.split('"roomCode":"')[1]?.split('"')[0];
      if (roomCode) {
        localStorage.setItem("regenwormen-session", JSON.stringify({ roomCode, playerId }));
      }
      dispatch({ type: "JOINED_ROOM", playerId });
    });
    socket.on("roomUpdated", ({ state: gs }) => {
      dispatch({ type: "GAME_UPDATED", state: gs });
    });
    socket.on("error", ({ message }) => {
      dispatch({ type: "ERROR", message });
    });

    socket.on("disconnect", () => {
      if (state.roomCode && state.playerId) {
        dispatch({ type: "ERROR", message: "Verbinding verbroken. Automatisch reconnecten..." });
      }
    });

    socket.on("connect", () => {
      dispatch({ type: "CLEAR_ERROR" });
      // Automatisch rejoin als we een room hebben
      if (state.roomCode && state.playerId) {
        socket.emit("rejoinRoom", { roomCode: state.roomCode, playerId: state.playerId });
      }
    });

    return () => {
      socket.off("roomCreated");
      socket.off("joinedRoom");
      socket.off("roomUpdated");
      socket.off("error");
      socket.off("disconnect");
      socket.off("connect");
      socket.disconnect();
    };
  }, []);

  const clearError = () => dispatch({ type: "CLEAR_ERROR" });

  if (state.screen === "home" || state.screen === "lobby") {
    return (
      <>
        <Lobby
          screen={state.screen}
          roomCode={state.roomCode}
          playerId={state.playerId}
          gameState={state.gameState}
          error={state.error}
          onClearError={clearError}
        />
        <Footer />
      </>
    );
  }
  if (state.screen === "game" && state.gameState) {
    return (
      <>
        <GameTable
          gameState={state.gameState}
          playerId={state.playerId}
          error={state.error}
          onClearError={clearError}
        />
        <Footer />
      </>
    );
  }
  if (state.screen === "finished" && state.gameState) {
    return (
      <>
        <Finished gameState={state.gameState} playerId={state.playerId} />
        <Footer />
      </>
    );
  }
  return (
    <>
      <Lobby screen="home" roomCode="" playerId="" gameState={null} error="" onClearError={() => {}} />
      <Footer />
    </>
  );
}
