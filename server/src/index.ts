import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "@regenvormen/shared";
import { registerHandlers } from "./gameSocket";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: "*" },
});

app.get("/health", (_, res) => res.json({ ok: true }));

io.on("connection", (socket) => {
  registerHandlers(io, socket);
});

httpServer.listen(PORT, () => {
  console.log(`Regenvormen server luistert op poort ${PORT}`);
});
