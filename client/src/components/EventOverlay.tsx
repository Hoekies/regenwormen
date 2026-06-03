import { useEffect, useState } from "react";
import type { LastEvent } from "@regenvormen/shared";
import { WORM_DIZZY } from "../wormAvatar";
import Dice from "./Dice";
import "./EventOverlay.css";

interface Props {
  event: LastEvent;
}

export default function EventOverlay({ event }: Props) {
  const [visible, setVisible] = useState(false);
  const [shown, setShown] = useState<LastEvent>(null);

  useEffect(() => {
    if (!event) return;
    // Alleen tonen als het een nieuw event is (nieuw id)
    if (shown && shown.id === event.id) return;
    setShown(event);
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(t);
  }, [event?.id]);

  if (!visible || !shown) return null;

  if (shown.type === "bust") {
    const { playerName, returnedTile, closedTile, bustDice } = shown;
    return (
      <div className="event-overlay event-bust" onClick={() => setVisible(false)}>
        <img src={WORM_DIZZY} alt="Bust!" className="overlay-img" />
        <div className="overlay-text">
          <div className="overlay-title">💥 Verflixt!</div>
          <div className="overlay-body">
            <strong>{playerName}</strong> heeft een bust.
            {returnedTile && <> Tegel <span className="tile-chip">{returnedTile}</span> terug.</>}
            {closedTile && <> Tegel <span className="tile-chip tile-closed">{closedTile}</span> dicht.</>}
          </div>
          {bustDice && bustDice.length > 0 && (
            <Dice dice={bustDice} />
          )}
        </div>
      </div>
    );
  }

  if (shown.type === "steal") {
    const { playerName, fromPlayerName, tile } = shown;
    return (
      <div className="event-overlay event-steal" onClick={() => setVisible(false)}>
        <img src="/img/munt.png" alt="Gestolen!" className="overlay-img" />
        <div className="overlay-text">
          <div className="overlay-title">😈 Gestolen!</div>
          <div className="overlay-body">
            <strong>{playerName}</strong> pakt tegel <span className="tile-chip">{tile}</span> af van <strong>{fromPlayerName}</strong>!
          </div>
        </div>
      </div>
    );
  }

  if (shown.type === "claim") {
    const { playerName, tile } = shown;
    return (
      <div className="event-overlay event-claim" onClick={() => setVisible(false)}>
        <img src="/img/schatkist.png" alt="Tegel gepakt!" className="overlay-img" />
        <div className="overlay-text">
          <div className="overlay-title">🎉 Tegel gepakt!</div>
          <div className="overlay-body">
            <strong>{playerName}</strong> neemt tegel <span className="tile-chip">{tile}</span>.
          </div>
        </div>
      </div>
    );
  }

  return null;
}
