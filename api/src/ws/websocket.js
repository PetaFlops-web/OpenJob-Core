let _io = null;

export function getIO() {
  if (!_io) throw new Error("Socket.io not initialized");
  return _io;
}

import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";

let _subClient = null;

const getSocketAuthToken = (socket) => socket.handshake.auth?.token;

const canJoinCompanyRoom = (socket, company) => (
  socket.user?.role === "recruiter" && company?.user_id === socket.user?.id
);

const setupRealtimeSubscriber = async () => {
  try {
    const redisPassword = process.env.REDIS_PASSWORD ? `:${process.env.REDIS_PASSWORD}@` : "";
    const redisUrl = process.env.REDIS_URL || `redis://${redisPassword}${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
    _subClient = createClient({ url: redisUrl });
    _subClient.on("error", (err) => {
      logger.warn("Realtime subscriber Redis error:", err.message);
    });

    await _subClient.connect();

    await _subClient.subscribe("websocket_events", (msg) => {
      try {
        const { room, event, payload } = JSON.parse(msg);
        if (_io && room && event) {
          _io.to(room).emit(event, payload);
        }
      } catch (err) {
        logger.warn("Realtime subscriber parse failed:", err.message);
      }
    });

    logger.log("WebSocket realtime subscriber connected (Redis channel: websocket_events)");

    const cleanup = async () => {
      if (_subClient?.isOpen) {
        await _subClient.quit();
      }
    };
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  } catch (err) {
    logger.warn("WebSocket realtime subscriber unavailable:", err.message);
  }
};

const setupWebSocket = async (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ALLOWED_ORIGINS?.split(",") || ["http://localhost:5173"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Redis adapter for multi-instance — try but don't crash if unavailable
  try {
    const redisPassword = process.env.REDIS_PASSWORD ? `:${process.env.REDIS_PASSWORD}@` : "";
    const redisUrl = process.env.REDIS_URL || `redis://${redisPassword}${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    io.adapter(createAdapter(pubClient, subClient));
    logger.log("WebSocket Redis adapter connected");

    const cleanup = async () => {
      await pubClient.quit();
      await subClient.quit();
    };
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  } catch (err) {
    logger.warn("WebSocket running without Redis adapter (single instance mode):", err.message);
  }

  // Realtime subscriber for cross-process events (consumer → Redis → WebSocket)
  await setupRealtimeSubscriber();

  // Auth middleware
  io.use((socket, next) => {
    const token = getSocketAuthToken(socket);
    if (!token) return next(new Error("Authentication required"));

    try {
      const user = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
      socket.user = user;
      next();
    } catch (_err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    logger.log(`WebSocket connected: ${socket.id} (user: ${socket.user?.id})`);

    const userId = socket.user.id;
    socket.join(`user:${userId}`);

    // Verify company ownership before joining company room
    const companyId = socket.handshake.auth?.company_id;
    if (companyId && socket.user.role === "recruiter") {
      try {
        const { default: CompaniesRepository } = await import("../companies/companies.repository.js");
        const company = await CompaniesRepository.getCompanyById(companyId);
        if (canJoinCompanyRoom(socket, company)) {
          socket.join(`company:${companyId}`);
          socket.companyId = companyId;
        }
      } catch (_err) {
        // DB lookup failed — don't join company room
      }
    }

    // join_room event REMOVED — all room assignments are done above
    // No dynamic room join allowed for security reasons

    socket.on("mark_read", (data) => {
      socket.emit("marked_read", { notificationId: data?.notificationId });
    });

    socket.on("disconnect", (reason) => {
      logger.log(`WebSocket disconnected: ${socket.id} (reason: ${reason})`);
    });
  });

  _io = io;
  return io;
};

export default setupWebSocket;
export { getSocketAuthToken, canJoinCompanyRoom };
