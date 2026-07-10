import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { env } from '../config/env.js';
import { redis, redisPub, redisSub } from '../config/redis.js';
import { socketAuth } from './socketAuth.js';
import { registerPresence } from './presence.js';
import { registerChat } from './chat.js';

export function initSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.CLIENT_URL, credentials: true },
  });

  io.adapter(createAdapter(redisPub, redisSub)); // масштабирование на N инстансов
  io.use(socketAuth);                            // JWT из handshake.auth.token → socket.user

  io.on('connection', (socket) => {
    registerPresence(io, socket, redis);
    registerChat(io, socket, redis);
  });

  return io;
}
