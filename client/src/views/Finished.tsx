import type { GameState } from "@regenvormen/shared";
import { scoreWorms } from "@regenvormen/shared";
import { wormAvatar, WORM_WINNER, WORM_CRY, WORM_DEAD } from "../wormAvatar";
import "./Finished.css";

interface Props {
  gameState: GameState;
  playerId: string;
}

export default function Finished({ gameState, playerId }: Props) {
  const sorted = [...gameState.players].sort((a, b) => scoreWorms(b) - scoreWorms(a));
  const winnerIndex = gameState.players.findIndex((p) => p.id === gameState.winner);
  const winner = gameState.players[winnerIndex];
  const myIndex = gameState.players.findIndex((p) => p.id === playerId);
  const iWon = gameState.winner === playerId;

  return (
    <div className="finished-container">
      <div className={`finished-card card ${iWon ? "card-win" : "card-lose"}`}>

        <img
          src={iWon ? "/img/victory.png" : "/img/gameover.png"}
          alt={iWon ? "Victory!" : "Game Over"}
          className="finished-sign"
        />

        <div className="finished-hero">
          {iWon ? (
            /* Winnaar: kroonworm + schatkist */
            <>
              <img src={WORM_WINNER} alt="" className="finished-hero-worm" />
              <div className="finished-hero-center">
                <p className="finished-subtitle win">Gefeliciteerd!</p>
                <img src="/img/schatkist.png" alt="" className="finished-hero-item" />
              </div>
            </>
          ) : (
            /* Verliezer: huilende worm + grafje */
            <>
              <img src={WORM_CRY} alt="" className="finished-hero-worm" />
              <div className="finished-hero-center">
                <p className="finished-subtitle lose">{winner?.name ?? "?"} wint!</p>
                <img src={WORM_DEAD} alt="" className="finished-hero-item" />
              </div>
            </>
          )}
        </div>

        <table className="score-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Naam</th>
              <th>Tegels</th>
              <th><img src="/img/munt.png" alt="wormen" className="th-coin" /></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => {
              const origIdx = gameState.players.findIndex((gp) => gp.id === p.id);
              const isWinner = p.id === gameState.winner;
              return (
                <tr key={p.id} className={`${p.id === playerId ? "me" : ""} ${isWinner ? "winner-row" : ""}`}>
                  <td>{i + 1}</td>
                  <td className="name-cell">
                    <img
                      src={isWinner ? WORM_WINNER : wormAvatar(origIdx)}
                      alt=""
                      className="table-worm"
                    />
                    {p.name}
                    {isWinner && <span className="winner-crown">👑</span>}
                  </td>
                  <td>{p.tiles.join(", ") || "–"}</td>
                  <td><strong>{scoreWorms(p)}</strong></td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <button className="btn-primary new-btn" onClick={() => window.location.reload()}>
          Nieuw spel
        </button>
      </div>
    </div>
  );
}
