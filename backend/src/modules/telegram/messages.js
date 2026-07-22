const RU = {
  startHelp:
    'Здравствуйте! Чтобы привязать Telegram, нажмите "Привязать Telegram" в кабинете CRM и откройте полученную ссылку.',
  tokenInvalid:
    'Код привязки недействителен или истек. Получите новый код в кабинете CRM.',
  bindSuccess: 'Telegram успешно привязан. Теперь вы будете получать уведомления здесь.',
  alreadyLinkedUser: 'Этот аккаунт CRM уже привязан к Telegram.',
  alreadyLinkedChat: 'Этот Telegram-чат уже привязан к другому аккаунту CRM.',
  stopSuccess: 'Telegram отвязан. Уведомления больше не будут приходить в этот чат.',
  stopMissing: 'Этот чат не был привязан к CRM.',
  genericError: 'Не удалось выполнить действие. Попробуйте позже или получите новый код в кабинете CRM.',
};

const UZ = {
  startHelp:
    'Assalomu alaykum! Telegramni ulash uchun CRM kabinetida "Telegramni ulash" tugmasini bosing va berilgan havolani oching.',
  tokenInvalid: 'Ulash kodi yaroqsiz yoki muddati tugagan. CRM kabinetidan yangi kod oling.',
  bindSuccess: 'Telegram muvaffaqiyatli ulandi. Endi xabarlar shu yerga keladi.',
  alreadyLinkedUser: 'Bu CRM akkaunt allaqachon Telegramga ulangan.',
  alreadyLinkedChat: 'Bu Telegram chat boshqa CRM akkauntga ulangan.',
  stopSuccess: 'Telegram uzildi. Bu chatga xabarlar boshqa kelmaydi.',
  stopMissing: 'Bu chat CRMga ulanmagan.',
  genericError: 'Amalni bajarib bo‘lmadi. Keyinroq urinib ko‘ring yoki CRM kabinetidan yangi kod oling.',
};

export function messages(language = 'ru') {
  return language === 'uz' ? UZ : RU;
}
