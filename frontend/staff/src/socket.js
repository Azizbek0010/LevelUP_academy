import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { USING_MOCKS } from './api.js';

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

/**
 * Live-обновления журнала davomat по группе.
 *
 * Подписка серверная (`attendance:subscribe` → комната группы), поэтому её
 * НУЖНО повторять после каждого reconnect: socket.io при разрыве теряет все
 * комнаты, и без повторного subscribe страница молча перестала бы обновляться.
 *
 * `onUpdate` держим в ref — иначе новая ссылка на колбэк при каждом рендере
 * пересоздавала бы подписку.
 */
export function useAttendanceLive(token, groupId, onUpdate) {
  const cbRef = useRef(onUpdate);
  cbRef.current = onUpdate;

  useEffect(() => {
    if (!token || !groupId || USING_MOCKS) return undefined;

    const s = getSocket(token);
    const subscribe = () => s.emit('attendance:subscribe', { groupId });

    if (s.connected) subscribe();
    s.on('connect', subscribe); // и при первом connect, и после каждого реконнекта

    const handler = (payload) => {
      if (payload?.groupId === groupId) cbRef.current?.(payload);
    };
    s.on('attendance:updated', handler);

    return () => {
      s.off('attendance:updated', handler);
      s.off('connect', subscribe);
      s.emit('attendance:unsubscribe', { groupId });
    };
  }, [token, groupId]);
}
