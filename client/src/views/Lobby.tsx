import { useState } from "react";

function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: "Hoekies Regenwormen", url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button className="share-btn" onClick={handleShare} title="Deel de link">
      <img src="/favicon.svg" alt="deel" className="share-favicon" />
      <span>{copied ? "Gekopieerd!" : "Deel link"}</span>
    </button>
  );
}
import type { GameState } from "@regenvormen/shared";
import socket from "../socket";
import { wormAvatar } from "../wormAvatar";
import "./Lobby.css";

interface Props {
  screen: "home" | "lobby";
  roomCode: string;
  playerId: string;
  gameState: GameState | null;
  error: string;
  onClearError: () => void;
}

export default function Lobby({ screen, roomCode, playerId, gameState, error, onClearError }: Props) {
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [tab, setTab] = useState<"create" | "join">("create");

  const isHost = gameState?.hostId === playerId;
  const players = gameState?.players ?? [];

  function handleCreate() {
    if (!name.trim()) return;
    onClearError();
    socket.emit("createRoom", { playerName: name.trim() });
  }

  function handleJoin() {
    if (!name.trim() || !joinCode.trim()) return;
    onClearError();
    socket.emit("joinRoom", { roomCode: joinCode.trim().toUpperCase(), playerName: name.trim() });
  }

  function handleStart() {
    socket.emit("startGame");
  }

  if (screen === "lobby" && roomCode) {
    return (
      <div className="lobby-container">
        <div className="lobby-card card">
          <img src="/img/logo.png" alt="Wormen" className="lobby-logo" />

          <div className="room-code-display">
            <span className="room-label">Room-code</span>
            <span className="room-code">{roomCode}</span>
          </div>

          <h2 className="players-heading">Spelers ({players.length}/7)</h2>
          <ul className="players-list">
            {players.map((p, i) => (
              <li key={p.id} className={`player-item ${p.id === playerId ? "me" : ""}`}>
                <img src={wormAvatar(i)} alt="" className="player-worm" />
                <span className="player-name-text">{p.name}</span>
                {p.id === gameState?.hostId && <span className="host-badge">HOST</span>}
                {p.id === playerId && <span className="you-badge">jij</span>}
              </li>
            ))}
          </ul>

          {isHost && players.length >= 1 && (
            <button className="start-img-btn" onClick={handleStart}>
              <img src="/img/start.png" alt="Start!" />
            </button>
          )}
          {!isHost && <p className="waiting-msg">Wachten op de host…</p>}

          <div className="deco-bottom-row">
            <img src="/img/worm2.png" alt="" className="deco-worm" aria-hidden="true" />
            <img src="/img/boomstronk.png" alt="" className="deco-stump" aria-hidden="true" />
            <img src="/img/worm3.png" alt="" className="deco-worm deco-worm--flip" aria-hidden="true" />
          </div>

          {error && <p className="error-msg">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="lobby-container">
      <div className="lobby-card card">
        <img src="/img/logo.png" alt="Wormen" className="lobby-logo" />
        <p className="lobby-sub">Online dobbelspel voor 2–7 spelers</p>

        <div className="tab-row">
          <button className={`tab-btn ${tab === "create" ? "active" : ""}`} onClick={() => setTab("create")}>
            Nieuwe room
          </button>
          <button className={`tab-btn ${tab === "join" ? "active" : ""}`} onClick={() => setTab("join")}>
            Joinen
          </button>
        </div>

        <div className="form-group">
          <label>Jouw naam</label>
          <input
            type="text"
            placeholder="bijv. René"
            value={name}
            maxLength={20}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (tab === "create" ? handleCreate() : handleJoin())}
          />
        </div>

        {tab === "join" && (
          <div className="form-group">
            <label>Room-code</label>
            <input
              type="text"
              placeholder="bijv. WXYZ"
              value={joinCode}
              maxLength={4}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
          </div>
        )}

        {tab === "create" ? (
          <button className="btn-primary action-btn" onClick={handleCreate} disabled={!name.trim()}>
            Room aanmaken
          </button>
        ) : (
          <button className="btn-secondary action-btn" onClick={handleJoin} disabled={!name.trim() || !joinCode.trim()}>
            Joinen
          </button>
        )}

        <ShareButton />

        <div className="deco-bottom-row">
          <img src="/img/worm1.png" alt="" className="deco-worm" aria-hidden="true" />
          <img src="/img/boomstronk.png" alt="" className="deco-stump" aria-hidden="true" />
          <img src="/img/worm4.png" alt="" className="deco-worm deco-worm--flip" aria-hidden="true" />
        </div>

        {error && <p className="error-msg">{error}</p>}
      </div>
    </div>
  );
}
