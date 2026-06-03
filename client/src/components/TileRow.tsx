import { wormsOnTile } from "@regenvormen/shared";
import "./TileRow.css";

function WormIcons({ count }: { count: number }) {
  return (
    <div className="tile-worm-icons">
      {Array.from({ length: count }, (_, i) => (
        <img key={i} src="/img/worm3.png" alt="worm" className="tile-worm-img" />
      ))}
    </div>
  );
}

interface TileRowProps {
  tiles: number[];
  closedTiles: number[];
}

export default function TileRow({ tiles, closedTiles }: TileRowProps) {
  const allTiles = Array.from({ length: 16 }, (_, i) => i + 21);
  return (
    <div className="tile-area">
      <div className="tile-row">
        {allTiles.map((t) => {
          const available = tiles.includes(t);
          const closed = closedTiles.includes(t);
          return (
            <div key={t} className={`tile ${available ? "available" : ""} ${closed ? "closed" : ""}`}>
              <span className="tile-num">{t}</span>
              {available && <WormIcons count={wormsOnTile(t)} />}
              {closed && <span className="tile-x">✕</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
