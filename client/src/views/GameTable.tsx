import { useState, useEffect } from "react";
import type { GameState, DieFace } from "@regenvormen/shared";
import { availablePicks, claimableTile, currentSum, findStealTarget, hasWorm } from "@regenvormen/shared";
import socket from "../socket";
import Dice from "../components/Dice";
import DiceButton from "../components/DiceButton";
import TileRow from "../components/TileRow";
import PlayerStack from "../components/PlayerStack";
import EventOverlay from "../components/EventOverlay";
import { useDiceSound } from "../hooks/useDiceSound";
import "./GameTable.css";

interface Props {
  gameState: GameState;
  playerId: string;
  error: string;
  onClearError: () => void;
}

export default function GameTable({ gameState, playerId, error, onClearError }: Props) {
  const [rolling, setRolling] = useState(false);
  useDiceSound(rolling);
  const { turn, players, currentPlayerIndex, tiles } = gameState;
  const currentPlayer = players[currentPlayerIndex];
  const isMyTurn = currentPlayer.id === playerId;

  const setAside = turn.setAside;
  const lastRoll = turn.lastRoll;
  const sum = currentSum(setAside);
  const worm = hasWorm(setAside);
  const usedValues = turn.usedValues as DieFace[];
  const picks = availablePicks(lastRoll, usedValues);

  const canRoll = turn.phase === "rolling" && turn.dicePool.length > 0;
  const canStop = turn.phase === "rolling" && setAside.length > 0;

  // Toon preview wat er gaat gebeuren bij stoppen
  const stealTarget = worm ? findStealTarget(sum, players, currentPlayer.id) : null;
  const rowTile = worm ? claimableTile(sum, tiles) : null;
  const stopLabel = (() => {
    if (!worm || (!rowTile && !stealTarget)) return "✅ Stoppen (bust!)";
    if (rowTile === sum && stealTarget) return `✅ Pak tegel ${sum}`;
    if (stealTarget) {
      const target = players.find((p) => p.id === stealTarget);
      return `✅ Steel ${sum} van ${target?.name}`;
    }
    return `✅ Pak tegel ${rowTile}`;
  })();

  function handleRoll() {
    setRolling(true);
    socket.emit("rollDice");
    setTimeout(() => setRolling(false), 400);
  }

  function handlePick(face: DieFace) {
    onClearError();
    socket.emit("pickValue", { value: face });
  }

  function handleStop() {
    onClearError();
    socket.emit("stopAndClaim");
  }

  function handleLogout() {
    localStorage.removeItem("regenwormen-session");
    socket.emit("leaveRoom");
    socket.disconnect();
    window.location.href = "/";
  }

  useEffect(() => {
    if (error) {
      const t = setTimeout(onClearError, 3500);
      return () => clearTimeout(t);
    }
  }, [error, onClearError]);

  return (
    <div className="game-table">
      <EventOverlay event={gameState.lastEvent} />

      {/* Combined card: Tegels + Spelers + Turn-info */}
      <div className="game-card card">
        {/* Top: Tegels */}
        <div className="game-card-section">
          <TileRow tiles={tiles} closedTiles={gameState.closedTiles} />
        </div>

        {/* Middle: Spelers */}
        <div className="game-card-divider"></div>
        <div className="game-card-section">
          <div className="players-row">
            {players.map((p, i) => (
              <PlayerStack
                key={p.id}
                player={p}
                playerIndex={i}
                isActive={i === currentPlayerIndex}
                isMe={p.id === playerId}
              />
            ))}
          </div>
        </div>

        {/* Bottom: Turn-info */}
        <div className="game-card-divider"></div>
        <div className="game-card-section game-card-section--grow">
        <div className="turn-info">
          <span className="turn-player-name">{currentPlayer.name}</span>
          <span className="turn-sum">
            Som: <strong>{sum}</strong>
            {worm && <span className="worm-ok"> 🪱</span>}
          </span>
        </div>

        {setAside.length > 0 && (
          <div className="set-aside-area">
            <span className="set-aside-label">Apart gelegd</span>
            <Dice dice={setAside} />
          </div>
        )}

        {lastRoll.length > 0 && (
          <div className="roll-area">
            <span className="roll-label">Jouw worp</span>
            <Dice
              dice={lastRoll}
              selectable={isMyTurn && turn.phase === "picking"}
              availableFaces={picks}
              onSelect={handlePick}
              rolling={rolling}
            />
            {isMyTurn && turn.phase === "picking" && picks.length === 0 && (
              <div className="bust-warning">
                <img src="/img/bom.png" alt="bust" className="bust-icon" />
                Verflixt! Geen nieuwe waarde mogelijk.
              </div>
            )}
          </div>
        )}

        {isMyTurn && turn.phase === "picking" && picks.length > 0 && (
          <p className="pick-hint">Apart leggen ↑</p>
        )}

        {!isMyTurn && (
          <p className="waiting-msg">Wachten op {currentPlayer.name}…</p>
        )}

        {error && <p className="error-msg">{error}</p>}
        </div>
      </div>

      {/* Bottom: Gooi + Logout */}
      <div className="game-table-footer">
        {isMyTurn && (
          <>
            {canRoll && (
              <DiceButton
                count={turn.dicePool.length}
                onClick={handleRoll}
                rolling={rolling}
              />
            )}
            {canStop && (
              <button
                className={stealTarget ? "btn-danger" : "btn-secondary"}
                onClick={handleStop}
              >
                {stopLabel}
              </button>
            )}
          </>
        )}
        <button className="logout-btn logout-btn--game" onClick={handleLogout} title="Spel verlaten">✕</button>
      </div>
    </div>
  );
}
