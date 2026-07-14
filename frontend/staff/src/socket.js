import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

let socket = null;
let currentToken = null;

/** Получить (или создать) socket-соединение с бэкендом */
export function getSocket(token) {
  // Если токен сменился — переподключаемся
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

/** Отключить сокет */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Хук для получения количества "онлайн" (presence:count).
 * Слушает событие `presence:count` и возвращает последнее значение.
 */
export function useOnlineCount(token) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!token) {
      setCount(0);
      return;
    }

    const s = getSocket(token);

    const handler = (data) => {
      // data может быть числом или { count: number }
      const val = typeof data === 'object' ? data.count ?? 0 : Number(data) || 0;
      setCount(val);
    };

    s.on('presence:count', handler);

    return () => {
      s.off('presence:count', handler);
    };
  }, [token]);

  return count;
}
