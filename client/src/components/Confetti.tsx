import { useMemo } from "react";
import "./Confetti.css";

const COLORS = [
  "#FF6B6B", "#FFE66D", "#4ECDC4", "#51CF66",
  "#CC5DE8", "#FF9100", "#339AF0", "#FF69B4", "#FFAA00",
];

const COUNT = 72;

interface Piece {
  left: string;
  color: string;
  delay: string;
  duration: string;
  width: string;
  height: string;
  rotation: string;
  isCircle: boolean;
}

function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

export default function Confetti() {
  const pieces: Piece[] = useMemo(() =>
    Array.from({ length: COUNT }, (_, i) => ({
      left: `${(seededRand(i * 7)  * 100).toFixed(1)}%`,
      color: COLORS[i % COLORS.length],
      delay: `${(seededRand(i * 13) * 3).toFixed(2)}s`,
      duration: `${(2.5 + seededRand(i * 17) * 2.5).toFixed(2)}s`,
      width: `${8 + Math.floor(seededRand(i * 11) * 8)}px`,
      height: `${6 + Math.floor(seededRand(i * 19) * 10)}px`,
      rotation: `${Math.floor(seededRand(i * 23) * 360)}deg`,
      isCircle: i % 4 === 0,
    })), []);

  return (
    <div className="confetti-wrap" aria-hidden="true">
      {pieces.map((p, i) => (
        <div
          key={i}
          className="confetti-bit"
          style={{
            left: p.left,
            backgroundColor: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
            width: p.width,
            height: p.height,
            borderRadius: p.isCircle ? "50%" : "3px",
            transform: `rotate(${p.rotation})`,
          }}
        />
      ))}
    </div>
  );
}
