import { useState, useEffect } from "react";
import type { Die, DieFace } from "@regenvormen/shared";
import "./Dice.css";

const FACE_SYMBOL: Record<string, string> = {
  "1": "1", "2": "2", "3": "3", "4": "4", "5": "5", "W": "🪱",
};

const ALL_FACES = ["1", "2", "3", "4", "5", "W"];

interface SingleDieProps {
  die: Die;
  selectable: boolean;
  onSelect?: (face: DieFace) => void;
  rolling?: boolean;
  index: number;
}

function SingleDie({ die, selectable, onSelect, rolling, index }: SingleDieProps) {
  const [displayFace, setDisplayFace] = useState(String(die.face));

  useEffect(() => {
    if (!rolling) {
      setDisplayFace(String(die.face));
      return;
    }
    const interval = setInterval(() => {
      setDisplayFace(ALL_FACES[Math.floor(Math.random() * ALL_FACES.length)]);
    }, 60);
    return () => clearInterval(interval);
  }, [rolling, die.face]);

  const isWorm = displayFace === "W";
  return (
    <button
      className={`die ${isWorm ? "worm" : ""} ${selectable ? "selectable" : ""} ${rolling ? "rolling" : ""}`}
      style={rolling ? { animationDelay: `${index * 25}ms` } : undefined}
      disabled={!selectable}
      onClick={() => selectable && onSelect?.(die.face)}
      title={selectable ? `Kies ${FACE_SYMBOL[String(die.face)]}` : undefined}
    >
      {FACE_SYMBOL[displayFace] ?? displayFace}
    </button>
  );
}

interface DiceProps {
  dice: Die[];
  selectable?: boolean;
  onSelect?: (face: DieFace) => void;
  availableFaces?: DieFace[];
  rolling?: boolean;
}

export default function Dice({ dice, selectable, onSelect, availableFaces = [], rolling }: DiceProps) {
  return (
    <div className="dice-row">
      {dice.map((die, i) => (
        <SingleDie
          key={die.id}
          die={die}
          index={i}
          selectable={!!(selectable && availableFaces.includes(die.face))}
          onSelect={onSelect}
          rolling={rolling}
        />
      ))}
    </div>
  );
}
