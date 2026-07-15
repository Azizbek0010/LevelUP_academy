import { io } from 'socket.io-client';

let socket = null;
let currentToken = null;

export function getSocket(token) {
  if (currentToken !== token) {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    currentToken = token;
  }

  if (socket?.connected) return socket;

  const url = typeof import.meta !== 'undefined' ? import.meta.env.VITE_API_URL || '' : '';

  socket = io(url, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on('connect_error', (err) => {
    console.warn('[socket] connect_error:', err.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
