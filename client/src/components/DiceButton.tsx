import "./DiceButton.css";

interface DiceButtonProps {
  count: number;
  onClick: () => void;
  disabled?: boolean;
  rolling?: boolean;
}

export default function DiceButton({ count, onClick, disabled, rolling }: DiceButtonProps) {
  return (
    <button
      className={`dice-btn ${rolling ? "rolling" : ""}`}
      onClick={onClick}
      disabled={disabled}
      title={`Gooien (${count} ${count === 1 ? "steen" : "stenen"})`}
    >
      <div className="dice-btn-inner">
        <div className="dice-btn-text">DOBBELEN</div>
        <div className="dice-btn-count">{count}</div>
      </div>
      <div className="dice-btn-deco">
        <span className="deco-dot"></span>
        <span className="deco-dot"></span>
        <span className="deco-dot"></span>
      </div>
    </button>
  );
}
