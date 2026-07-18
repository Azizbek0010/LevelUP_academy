/**
 * Реестр Socket.io-инстанса.
 *
 * `initSockets()` вызывается в server.js и возвращает io локально — из сервисов
 * (HTTP-хендлеров) до него не дотянуться. Живые события при этом нужны именно
 * оттуда: ментор проставил davomat обычным POST → админ должен увидеть это
 * сразу, без перезагрузки.
 *
 * Отсюда — маленький модуль-реестр вместо прокидывания io через все слои.
 * `emitTo` намеренно не бросает, если io ещё не поднят: воркер (worker.js)
 * дёргает те же сервисы без сокет-сервера, и падать из-за отсутствия live-канала
 * бизнес-операция не должна.
 */
let io = null;

export function setIO(instance) {
  io = instance;
}

export function getIO() {
  return io;
}

/** Отправить событие в комнату. No-op, если сокет-сервер не инициализирован. */
export function emitTo(room, event, payload) {
  if (!io) return false;
  io.to(room).emit(event, payload);
  return true;
}
