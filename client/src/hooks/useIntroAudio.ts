import { useEffect, useRef } from "react";

export function useIntroAudio(shouldPlay: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/audio/intro.mp3");
      audioRef.current.loop = true;
      audioRef.current.volume = 0.4;
    }

    if (shouldPlay) {
      audioRef.current.play().catch(() => {
        // Browser autoplay policy: user interaction required
      });
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [shouldPlay]);
}
