import type { Player } from "@regenvormen/shared";
import { scoreWorms, wormsOnTile } from "@regenvormen/shared";
import { wormAvatar } from "../wormAvatar";
import "./PlayerStack.css";

interface PlayerStackProps {
  player: Player;
  playerIndex: number;
  isActive: boolean;
  isMe: boolean;
  compact?: boolean;
}

export default function PlayerStack({ player, playerIndex, isActive, isMe, compact = false }: PlayerStackProps) {
  const worms = scoreWorms(player);
  return (
    <div className={`player-stack ${isActive ? "active" : ""} ${isMe ? "me" : ""} ${compact ? "compact" : ""}`} data-pi={playerIndex % 7}>
      <div className="stack-header">
        <img src={wormAvatar(playerIndex)} alt="" className="stack-avatar" />
        <span className="stack-name">{player.name}</span>
        <span className="stack-score-inline">
          <img src="/img/munt.png" alt="" className="score-coin-sm" />
          <span className="score-num-inline">{worms}</span>
        </span>
        {isMe && <span className="me-badge">jij</span>}
      </div>

      {!compact && (
        <div className="stack-tiles">
          {player.tiles.length === 0 ? (
            <span className="no-tiles">Geen tegels</span>
          ) : (
            player.tiles.map((t, i) => (
              <span key={i} className={`stack-tile ${i === 0 ? "top" : ""}`}>
                {t}
                <span className="tile-mini-worms">
                  {Array.from({ length: wormsOnTile(t) }, (_, wi) => (
                    <img key={wi} src="/img/worm3.png" alt="" className="mini-worm-img" />
                  ))}
                </span>
              </span>
            ))
          )}
        </div>
      )}
    </div>
  );
}
