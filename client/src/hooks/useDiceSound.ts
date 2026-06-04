import { useEffect, useRef } from "react";

export function useDiceSound(triggerRoll: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/audio/dobbelsteen.mp3");
      audioRef.current.volume = 0.6;
    }
  }, []);

  useEffect(() => {
    if (triggerRoll && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Silently fail if audio can't play
      });
    }
  }, [triggerRoll]);
}
