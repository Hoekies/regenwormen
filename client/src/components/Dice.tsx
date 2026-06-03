import type { Die, DieFace } from "@regenvormen/shared";
import "./Dice.css";

const FACE_SYMBOL: Record<string, string> = {
  "1": "1", "2": "2", "3": "3", "4": "4", "5": "5", "W": "🪱",
};

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
      {dice.map((die) => {
        const isSelectable = selectable && availableFaces.includes(die.face);
        return (
          <button
            key={die.id}
            className={`die ${die.face === "W" ? "worm" : ""} ${isSelectable ? "selectable" : ""} ${rolling ? "rolling" : ""}`}
            disabled={!isSelectable}
            onClick={() => isSelectable && onSelect?.(die.face)}
            title={isSelectable ? `Kies ${FACE_SYMBOL[String(die.face)]}` : undefined}
          >
            {FACE_SYMBOL[String(die.face)]}
          </button>
        );
      })}
    </div>
  );
}
