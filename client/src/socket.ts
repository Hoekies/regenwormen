import { io } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@regenvormen/shared";

const socket = io({
  autoConnect: false,
  transports: ["websocket", "polling"],
});

export default socket as import("socket.io-client").Socket<ServerToClientEvents, ClientToServerEvents>;
