// Speler-avatars: vrolijke/actieve wormen, max 7 spelers dus ruimschoots genoeg
const PLAYER_WORMS = [
  "/img/worm1.png",   // roze blij
  "/img/worm2.png",   // blauw feestmuts
  "/img/worm4.png",   // groen met appel
  "/img/worm7.png",   // blauw met raket
  "/img/worm8.png",   // blauw met vlees
  "/img/worm11.png",  // oranje piraat
  "/img/worm12.png",  // rode piraat
  "/img/worm13.png",  // groen militair
  "/img/worm6.png",   // groen medaille
  "/img/worm3.png",   // roze simpel
  "/img/worm9.png",   // roze spookje
  "/img/worm5.png",   // roze kroon (fallback)
];

export function wormAvatar(playerIndex: number): string {
  return PLAYER_WORMS[playerIndex % PLAYER_WORMS.length];
}

// Speciale wormen voor events
export const WORM_WINNER  = "/img/worm5.png";   // kroon
export const WORM_MEDAL   = "/img/worm6.png";   // medaille
export const WORM_DIZZY   = "/img/worm15.png";  // duizelig → bust
export const WORM_CRY     = "/img/worm16.png";  // huilend → verliezer
export const WORM_SLEEP   = "/img/worm14.png";  // slapend
export const WORM_DEAD    = "/img/worm-dead.png"; // graf → game over deco
