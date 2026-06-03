import "./DiceButton.css";

const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 20], [75, 20], [25, 50], [75, 50], [25, 80], [75, 80]],
};

function MiniDie({ value }: { value: number }) {
  const dots = DOT_POSITIONS[value] ?? DOT_POSITIONS[6];
  return (
    <span className="mini-die">
      {dots.map(([x, y], i) => (
        <span key={i} className="mini-dot" style={{ left: `${x}%`, top: `${y}%` }} />
      ))}
    </span>
  );
}

interface DiceButtonProps {
  count: number;
  onClick: () => void;
  disabled?: boolean;
  rolling?: boolean;
}

// Toon max 5 dobbelstenen visueel, de rest als getal
const SHOW_MAX = 5;

export default function DiceButton({ count, onClick, disabled, rolling }: DiceButtonProps) {
  const shown = Math.min(count, SHOW_MAX);
  const extra = count - shown;

  // Vaste "willekeurige" waarden per positie zodat het er realistisch uitziet
  const faces = [6, 3, 5, 2, 4, 1, 6, 3];

  return (
    <button
      className={`dice-btn ${rolling ? "rolling" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="dice-btn-dice">
        {Array.from({ length: shown }, (_, i) => (
          <MiniDie key={i} value={faces[i % faces.length]} />
        ))}
        {extra > 0 && <span className="dice-btn-extra">+{extra}</span>}
      </span>
    </button>
  );
}
