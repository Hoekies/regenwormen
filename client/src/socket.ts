import { io } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@regenvormen/shared";

// Lokaal: lege string = zelfde host (via Vite proxy)
// Productie: zet VITE_SERVER_URL in Vercel environment variables
//            naar je Railway/Render server-URL
const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "https://regenwormen-963v.onrender.com";

const socket = io(SERVER_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionDelay: 500,
  reconnectionDelayMax: 3000,
  reconnectionAttempts: 20,
});

export default socket as import("socket.io-client").Socket<ServerToClientEvents, ClientToServerEvents>;
