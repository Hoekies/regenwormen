import { useEffect, useRef } from "react";

export function useIntroAudio(shouldPlay: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/audio/intro.mp3");
      audioRef.current.loop = true;
      audioRef.current.volume = 0.4;
    }

    if (shouldPlay && !hasStartedRef.current) {
      // On mobile, start playing on first touch/click
      const startAudio = () => {
        audioRef.current?.play().catch(() => {
          // Fallback: user might have muted or audio blocked
        });
        hasStartedRef.current = true;
        document.removeEventListener("touchstart", startAudio);
        document.removeEventListener("click", startAudio);
      };

      document.addEventListener("touchstart", startAudio, { once: true });
      document.addEventListener("click", startAudio, { once: true });

      return () => {
        document.removeEventListener("touchstart", startAudio);
        document.removeEventListener("click", startAudio);
      };
    } else if (!shouldPlay && hasStartedRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      hasStartedRef.current = false;
    }
  }, [shouldPlay]);
}
