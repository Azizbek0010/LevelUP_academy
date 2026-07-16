// ⚠️ Удалён: весь код дублирован в backend/src/queues/workers/notification.worker.js.
// Уведомления обрабатываются через BullMQ worker (notification.queue → notification.worker),
// который использует resolveChatIds, sendToAll и fmt напрямую.
//
// Telegram.bzuf остаётся только для:
// - bot.handlers.js — команды /start и /stop (привязка Telegram)
// - bind-token.service.js — создание/потребление токенов привязки
// - telegram.controller.js + telegram.routes.js — API эндпоинт для создания токена
