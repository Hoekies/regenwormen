export type DieFace = 1 | 2 | 3 | 4 | 5 | "W";

export interface Die {
  id: number;
  face: DieFace;
}

export interface Player {
  id: string;
  name: string;
  tiles: number[]; // Bovenaan = index 0 (laatste gepakt)
}

export interface TurnState {
  phase: "rolling" | "picking" | "done";
  dicePool: Die[];   // Stenen die nog gegooid kunnen worden
  setAside: Die[];   // Stenen die apart gelegd zijn
  usedValues: Set<DieFace> | DieFace[]; // Waarden al gekozen (Set in runtime, array in transport)
  lastRoll: Die[];   // Laatste worp (voor animatie)
}

export type GamePhase = "lobby" | "playing" | "finished";

export type LastEvent =
  | { id: number; type: "bust"; playerName: string; returnedTile: number | null; closedTile: number | null }
  | { id: number; type: "claim"; playerName: string; tile: number }
  | { id: number; type: "steal"; playerName: string; fromPlayerName: string; tile: number }
  | null;

export interface GameState {
  roomCode: string;
  hostId: string;
  phase: GamePhase;
  players: Player[];
  currentPlayerIndex: number;
  tiles: number[];
  closedTiles: number[];
  turn: TurnState;
  winner: string | null;
  lastEvent: LastEvent;
}

// Socket.IO event payloads (client → server)
export interface CreateRoomPayload {
  playerName: string;
}

export interface JoinRoomPayload {
  roomCode: string;
  playerName: string;
}

export interface PickValuePayload {
  value: DieFace;
}

// Socket.IO event payloads (server → client)
export interface RoomUpdatedPayload {
  state: GameState;
}

export interface ErrorPayload {
  message: string;
}

export interface RoomCreatedPayload {
  roomCode: string;
  playerId: string;
}

export interface JoinedRoomPayload {
  playerId: string;
}

// Typed socket event maps
export interface ServerToClientEvents {
  roomUpdated: (payload: RoomUpdatedPayload) => void;
  roomCreated: (payload: RoomCreatedPayload) => void;
  joinedRoom: (payload: JoinedRoomPayload) => void;
  error: (payload: ErrorPayload) => void;
}

export interface ClientToServerEvents {
  createRoom: (payload: CreateRoomPayload) => void;
  joinRoom: (payload: JoinRoomPayload) => void;
  startGame: () => void;
  rollDice: () => void;
  pickValue: (payload: PickValuePayload) => void;
  stopAndClaim: () => void;
}
